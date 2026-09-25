import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const dataDir = process.argv[2] || process.env.MEDMCQA_DIR || "";
if (!dataDir) {
  console.error("Usage: npm run import:medmcqa -- <directory-containing-train.json-dev.json-test.json>");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.startsWith("postgres")
    ? { rejectUnauthorized: false }
    : false,
  max: 2,
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
});

const biologyRelevantSubjects = new Set(
  (process.env.MEDMCQA_SUBJECTS ||
    "Anatomy,Biochemistry,Microbiology,Pathology,Pharmacology,Physiology,Medicine,Pediatrics,Preventive & Social Medicine (PSM)")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
);

function readJsonRecords(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  if (raw.startsWith("[")) return JSON.parse(raw);
  return raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeRecord(row) {
  const options = [row.opa, row.opb, row.opc, row.opd].map(clean);
  const subject = clean(row.subject_name);
  const topic = clean(row.topic_name);
  const question = clean(row.question);
  const explanation = clean(row.exp);
  const correct = Number(row.cop);

  if (!row.id || !question || options.some(option => !option)) return null;
  if (!biologyRelevantSubjects.has(subject)) return null;
  if (row.choice_type && row.choice_type !== "single") return null;
  if (!Number.isInteger(correct) || correct < 1 || correct > 4) return null;

  return {
    id: `medmcqa-${String(row.id)}`,
    source: "medmcqa",
    sourceId: String(row.id),
    subject,
    topic: topic || null,
    question,
    options,
    correctIndex: correct - 1,
    explanation: explanation || null,
    difficulty: "advanced",
    active: true,
    metadata: {
      originalSubject: subject,
      originalTopic: topic || null,
      choiceType: row.choice_type || "single",
      sourceDataset: "MedMCQA",
      sourceRepository: "https://github.com/medmcqa/medmcqa",
    },
  };
}

const includeTest = String(process.env.MEDMCQA_INCLUDE_TEST || "false").toLowerCase() === "true";
const splitNames = includeTest ? ["train.json", "dev.json", "test.json"] : ["train.json", "dev.json"];
const files = splitNames
  .map(name => path.join(dataDir, name))
  .filter(filePath => fs.existsSync(filePath));

if (!files.length) {
  console.error(`No MedMCQA JSON files found in ${dataDir}. Expected train.json, dev.json and/or test.json.`);
  process.exit(1);
}

const BATCH_SIZE = 500;
const MAX_RETRIES = 5;

async function insertBatch(rows) {
  if (!rows.length) return;

  const values = [];
  const params = [];

  for (const item of rows) {
    const offset = params.length;
    values.push(
      \`($\${offset + 1},$\${offset + 2},$\${offset + 3},$\${offset + 4},$\${offset + 5},$\${offset + 6},$\${offset + 7}::jsonb,$\${offset + 8},$\${offset + 9},$\${offset + 10},$\${offset + 11},$\${offset + 12}::jsonb,NOW())\`,
    );
    params.push(
      item.id,
      item.source,
      item.sourceId,
      item.subject,
      item.topic,
      item.question,
      JSON.stringify(item.options),
      item.correctIndex,
      item.explanation,
      item.difficulty,
      item.active,
      JSON.stringify(item.metadata),
    );
  }

  const sql = \`INSERT INTO question_bank_items
    (id, source, source_id, subject, topic, question, options, correct_index, explanation, difficulty, active, metadata, updated_at)
    VALUES \${values.join(",")}
    ON CONFLICT (source, source_id) DO UPDATE SET
      subject=EXCLUDED.subject,
      topic=EXCLUDED.topic,
      question=EXCLUDED.question,
      options=EXCLUDED.options,
      correct_index=EXCLUDED.correct_index,
      explanation=EXCLUDED.explanation,
      difficulty=EXCLUDED.difficulty,
      active=EXCLUDED.active,
      metadata=EXCLUDED.metadata,
      updated_at=NOW()\`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await pool.query(sql, params);
      return;
    } catch (error) {
      const retryable = ["ECONNRESET", "ECONNREFUSED", "57P01", "08006", "08003"].includes(error.code);
      if (!retryable || attempt === MAX_RETRIES) throw error;
      const delay = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.warn(\`Database connection dropped; retrying batch in \${delay}ms (attempt \${attempt + 1}/\${MAX_RETRIES})...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

let imported = 0;
let skipped = 0;
let seen = 0;

try {
  for (const filePath of files) {
    const split = path.basename(filePath, ".json");
    console.log(\`Reading \${path.basename(filePath)}...\`);
    const records = readJsonRecords(filePath);
    let batch = [];

    for (const row of records) {
      seen += 1;
      const item = normalizeRecord(row);

      if (!item) {
        skipped += 1;
        continue;
      }

      item.metadata = { ...item.metadata, split };
      batch.push(item);

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        imported += batch.length;
        batch = [];
        if (imported % 5000 === 0) console.log(\`Imported \${imported} questions...\`);
      }
    }

    if (batch.length) {
      await insertBatch(batch);
      imported += batch.length;
    }
  }

  console.log(JSON.stringify({
    source: "medmcqa",
    files,
    seen,
    imported,
    skipped,
    includeTest,
    subjects: [...biologyRelevantSubjects],
  }, null, 2));
} catch (error) {
  console.error("MedMCQA import failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
