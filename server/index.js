import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 10000);
const jwtSecret = process.env.JWT_SECRET;

if (!process.env.DATABASE_URL || !jwtSecret) {
  console.error("DATABASE_URL and JWT_SECRET are required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    student_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS study_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS assessment_states (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, assessment_type)
  );
  CREATE TABLE IF NOT EXISTS assessment_submissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    assessment_type TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, session_id)
  );
`);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/\\s+/g, "");
}

function publicUser(row) {
  return {
    id: row.id,
    studentName: row.student_name,
    username: row.username,
    createdAt: row.created_at,
  };
}

function signUser(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "30d" });
}

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Authentication required." });
    const payload = jwt.verify(token, jwtSecret);
    const result = await pool.query("SELECT id, student_name, username, created_at FROM users WHERE id = $1", [payload.sub]);
    if (!result.rows[0]) return res.status(401).json({ error: "Account no longer exists." });
    req.user = result.rows[0];
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, service: "biology-study-api" });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const studentName = String(req.body?.studentName || "").trim();
    const password = String(req.body?.password || "");
    const username = normalizeUsername(req.body?.username || studentName);
    if (studentName.length < 2 || password.length < 6 || username.length < 2) {
      return res.status(400).json({ error: "Provide a name, username and password of at least 6 characters." });
    }
    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows[0]) return res.status(409).json({ error: "That username is already registered." });

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (id, student_name, username, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, student_name, username, created_at",
      [id, studentName, username, passwordHash],
    );
    const token = signUser(id);
    return res.status(201).json({ token, account: publicUser(result.rows[0]), progress: null, updatedAt: null });
  } catch (error) {
    console.error("register", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    if (!username || !password) return res.status(400).json({ error: "Username and password are required." });
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const progress = await pool.query("SELECT progress, updated_at FROM study_progress WHERE user_id = $1", [user.id]);
    const token = signUser(user.id);
    return res.json({ token, account: publicUser(user), progress: progress.rows[0]?.progress ?? null, updatedAt: progress.rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error("login", error);
    return res.status(500).json({ error: "Unable to sign in." });
  }
});

app.get("/api/me", auth, async (req, res) => res.json({ account: publicUser(req.user) }));

app.get("/api/progress", auth, async (req, res) => {
  const result = await pool.query("SELECT progress, updated_at FROM study_progress WHERE user_id = $1", [req.user.id]);
  res.json({ progress: result.rows[0]?.progress ?? null, updatedAt: result.rows[0]?.updated_at ?? null });
});

app.post("/api/assessment/claim", auth, async (req, res) => {
  const type = String(req.body?.type || "").toUpperCase();
  const sessionId = String(req.body?.sessionId || "");
  if (!["RAT", "CAT", "REVISION"].includes(type)) {
    return res.status(400).json({ error: "Invalid assessment submission." });
  }
  const parsedSession = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId);
  if (!parsedSession) {
    return res.status(400).json({ error: "Invalid assessment session." });
  }
  const result = await pool.query(
    `INSERT INTO assessment_submissions (user_id, session_id, assessment_type)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, session_id) DO NOTHING
     RETURNING submitted_at`,
    [req.user.id, sessionId, type],
  );
  return res.json({ accepted: Boolean(result.rows[0]), submittedAt: result.rows[0]?.submitted_at ?? null });
});

app.get("/api/assessment-state/:type", auth, async (req, res) => {
  const type = String(req.params.type || "").toUpperCase();
  if (!["RAT", "CAT", "REVISION"].includes(type)) return res.status(400).json({ error: "Invalid assessment type." });
  const result = await pool.query("SELECT state, updated_at FROM assessment_states WHERE user_id = $1 AND assessment_type = $2", [req.user.id, type]);
  res.json({ state: result.rows[0]?.state ?? null, updatedAt: result.rows[0]?.updated_at ?? null });
});

app.put("/api/progress", auth, async (req, res) => {
  if (!req.body || typeof req.body.progress !== "object" || Array.isArray(req.body.progress)) {
    return res.status(400).json({ error: "Invalid progress payload." });
  }
  const expectedUpdatedAt = req.body.expectedUpdatedAt ? new Date(req.body.expectedUpdatedAt) : null;
  if (req.body.expectedUpdatedAt && (!expectedUpdatedAt || Number.isNaN(expectedUpdatedAt.getTime()))) {
    return res.status(400).json({ error: "Invalid expectedUpdatedAt." });
  }

  const payload = JSON.stringify(req.body.progress);
  const expected = expectedUpdatedAt ? expectedUpdatedAt.toISOString() : null;

  if (!expected) {
    const inserted = await pool.query(
      `INSERT INTO study_progress (user_id, progress, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO NOTHING
       RETURNING updated_at`,
      [req.user.id, payload],
    );
    if (inserted.rows[0]) return res.json({ ok: true, updatedAt: inserted.rows[0].updated_at });
  }

  const result = await pool.query(
    `UPDATE study_progress
     SET progress = $2::jsonb, updated_at = NOW()
     WHERE user_id = $1 AND updated_at = $3::timestamptz
     RETURNING updated_at`,
    [req.user.id, payload, expected],
  );

  if (result.rows[0]) return res.json({ ok: true, updatedAt: result.rows[0].updated_at });

  const latest = await pool.query("SELECT progress, updated_at FROM study_progress WHERE user_id = $1", [req.user.id]);
  return res.status(409).json({
    error: "Cloud progress is newer than this device.",
    progress: latest.rows[0]?.progress ?? null,
    updatedAt: latest.rows[0]?.updated_at ?? null,
  });
});

app.listen(port, () => console.log(`Biology-Study API listening on port ${port}`));
