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
    return res.status(201).json({ token, account: publicUser(result.rows[0]), progress: null });
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
    const progress = await pool.query("SELECT progress FROM study_progress WHERE user_id = $1", [user.id]);
    const token = signUser(user.id);
    return res.json({ token, account: publicUser(user), progress: progress.rows[0]?.progress ?? null });
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

app.put("/api/progress", auth, async (req, res) => {
  if (!req.body || typeof req.body.progress !== "object" || Array.isArray(req.body.progress)) {
    return res.status(400).json({ error: "Invalid progress payload." });
  }
  await pool.query(
    `INSERT INTO study_progress (user_id, progress, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET progress = EXCLUDED.progress, updated_at = NOW()`,
    [req.user.id, JSON.stringify(req.body.progress)],
  );
  res.json({ ok: true });
});

app.listen(port, () => console.log(`Biology-Study API listening on port ${port}`));
