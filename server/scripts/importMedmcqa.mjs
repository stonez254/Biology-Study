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
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
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

const files = ["train.json", "dev.json", "test.json"]
  .map(name => path.join(dataDir, name))
  .filter(filePath => fs.existsSync(filePath));

if (!files.length) {
  console.error(`No MedMCQA JSON files found in ${dataDir}. Expected train.json, dev.json and/or test.json.`);
  process.exit(1);
}

const client = await pool.connect();
let imported = 0;
let skipped = 0;
let seen = 0;

try {
  await client.query("BEGIN");

  for (const filePath of files) {
    const split = path.basename(filePath, ".json");
    const records = readJsonRecords(filePath);

    for (const row of records) {
      seen += 1;
      const item = normalizeRecord(row);
      if (!item) {
        skipped += 1;
        continue;
      }

      await client.query(
        `INSERT INTO question_bank_items
          (id, source, source_id, subject, topic, question, options, correct_index, explanation, difficulty, active, metadata, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12::jsonb,NOW())
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
           updated_at=NOW()`,
        [
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
          JSON.stringify({ ...item.metadata, split }),
        ],
      );
      imported += 1;
    }
  }

  await client.query("COMMIT");
  console.log(JSON.stringify({
    source: "medmcqa",
    files,
    seen,
    imported,
    skipped,
    subjects: [...biologyRelevantSubjects],
  }, null, 2));
} catch (error) {
  await client.query("ROLLBACK");
  console.error("MedMCQA import failed:", error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
