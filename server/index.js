import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { QUESTION_ANSWER_KEY } from "./questionAnswerKey.js";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 10000);
const jwtSecret = process.env.JWT_SECRET;
const emailVerificationEnabled = String(process.env.EMAIL_VERIFICATION_ENABLED || "false").toLowerCase() === "true";

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
    email TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
  CREATE TABLE IF NOT EXISTS email_verification_codes (id UUID PRIMARY KEY, email TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  CREATE INDEX IF NOT EXISTS email_verification_lookup_idx ON email_verification_codes (LOWER(email), purpose, created_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email)) WHERE email IS NOT NULL;
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
    result JSONB,
    PRIMARY KEY (user_id, session_id)
  );
  ALTER TABLE assessment_submissions ADD COLUMN IF NOT EXISTS result JSONB;
  CREATE TABLE IF NOT EXISTS verified_account_state (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  INSERT INTO verified_account_state (user_id, points)
  SELECT u.id, COALESCE((sp.progress->>'points')::integer, 0)
  FROM users u
  LEFT JOIN study_progress sp ON sp.user_id = u.id
  ON CONFLICT (user_id) DO NOTHING;
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

const AUTH_LIMITS = {
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  register: { max: 5, windowMs: 60 * 60 * 1000 },
  verify: { max: 10, windowMs: 15 * 60 * 1000 },
  code: { max: 5, windowMs: 15 * 60 * 1000 },
  reset: { max: 10, windowMs: 15 * 60 * 1000 },
};
const authRateBuckets = new Map();

function getClientKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.ip || "unknown";
}

function checkAuthRateLimit(req, res, action) {
  const limit = AUTH_LIMITS[action];
  const key = `${action}:${getClientKey(req)}`;
  const now = Date.now();
  let bucket = authRateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + limit.windowMs };
  }

  bucket.count += 1;
  authRateBuckets.set(key, bucket);

  if (authRateBuckets.size > 5000) {
    for (const [bucketKey, value] of authRateBuckets) {
      if (value.resetAt <= now) authRateBuckets.delete(bucketKey);
    }
  }

  if (bucket.count > limit.max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({ error: "Too many authentication attempts. Please try again later." });
    return false;
  }

  return true;
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function publicUser(row) {
  return {
    id: row.id,
    studentName: row.student_name,
    username: row.username,
    email: row.email ?? null,
    emailVerified: Boolean(row.email_verified),
    createdAt: row.created_at,
  };
}

function codeHash(email, purpose, code) {
  return crypto.createHmac("sha256", jwtSecret).update(purpose + ":" + email + ":" + code).digest("hex");
}
function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}
async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error("Email delivery is not configured.");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], subject, html }) });
  const body = await response.text();
  if (!response.ok) {
    console.error("Resend email rejected", { status: response.status, body, to, from, subject });
    throw new Error("Email provider rejected the message: " + response.status);
  }
  console.log("Resend email accepted", { to, from, subject, response: body });
}
async function issueCode(email, purpose, minutes) {
  const code = generateCode();
  await pool.query("DELETE FROM email_verification_codes WHERE LOWER(email)=LOWER($1) AND purpose=$2", [email, purpose]);
  await pool.query("INSERT INTO email_verification_codes (id,email,purpose,code_hash,expires_at) VALUES ($1,$2,$3,$4,NOW()+($5 || ' minutes')::interval)", [crypto.randomUUID(), email, purpose, codeHash(email,purpose,code), String(minutes)]);
  return code;
}
async function verifyCode(email, purpose, code) {
  const r = await pool.query("SELECT id,code_hash,expires_at,attempts FROM email_verification_codes WHERE LOWER(email)=LOWER($1) AND purpose=$2 ORDER BY created_at DESC LIMIT 1", [email,purpose]);
  const row = r.rows[0];
  if (!row || new Date(row.expires_at).getTime() <= Date.now() || row.attempts >= 5) return false;
  const valid = crypto.timingSafeEqual(Buffer.from(codeHash(email,purpose,code),"hex"), Buffer.from(row.code_hash,"hex"));
  if (!valid) { await pool.query("UPDATE email_verification_codes SET attempts=attempts+1 WHERE id=$1",[row.id]); return false; }
  await pool.query("DELETE FROM email_verification_codes WHERE id=$1",[row.id]);
  return true;
}
async function sendVerificationCode(email, purpose, code) {
  const reset = purpose === "password-reset";
  const subject = reset ? "Biology-Study password reset code" : "Verify your Biology-Study email";
  const title = reset ? "Reset your password" : "Verify your email address";
  const html = "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px\"><h2>" + title + "</h2><p>Your Biology-Study verification code is:</p><div style=\"font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0\">" + code + "</div><p>This code expires in " + (reset ? "15" : "10") + " minutes.</p><p style=\"color:#666\">EDERSTONE @2026</p></div>";
  await sendEmail(email, subject, html);
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
    const result = await pool.query("SELECT id, student_name, username, email, email_verified, created_at FROM users WHERE id = $1", [payload.sub]);
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
  if (!checkAuthRateLimit(req, res, "register")) return;

  try {
    const studentName = String(req.body?.studentName || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const username = normalizeUsername(req.body?.username || studentName);

    if (studentName.length < 2 || studentName.length > 80) {
      return res.status(400).json({ error: "Student name must be between 2 and 80 characters." });
    }
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ error: "Password must be between 6 and 128 characters." });
    }
    if (username.length < 2 || username.length > 40 || !/^[a-z0-9._-]+$/.test(username)) {
      return res.status(400).json({ error: "Username must be 2-40 characters using letters, numbers, dots, underscores or hyphens." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    const existing = await pool.query("SELECT id, username, email FROM users WHERE username = $1 OR LOWER(email) = LOWER($2) LIMIT 1", [username, email]);
    if (existing.rows[0]?.username === username) return res.status(409).json({ error: "That username is already registered." });
    if (existing.rows[0]) return res.status(409).json({ error: "That email address is already registered." });

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (id, student_name, username, email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, student_name, username, email, created_at",
      [id, studentName, username, email, passwordHash],
    );
    await pool.query("INSERT INTO verified_account_state (user_id, points) VALUES ($1, 0) ON CONFLICT (user_id) DO NOTHING", [id]);
    if (emailVerificationEnabled) {
      try {
        const code = await issueCode(email, "signup", 10);
        await sendVerificationCode(email, "signup", code);
      } catch (mailError) {
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        console.error("signup email", mailError);
        return res.status(503).json({ error: "We could not send the verification email. Please try again shortly." });
      }
      return res.status(201).json({ verificationRequired: true, account: publicUser(result.rows[0]) });
    }
    return res.status(201).json({ verificationRequired: false, token: signUser(id), account: publicUser(result.rows[0]), progress: null, updatedAt: null });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ error: "That username or email address is already registered." });
    console.error("register", error);
    return res.status(500).json({ error: "Unable to create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  if (!checkAuthRateLimit(req, res, "login")) return;

  try {
    const identifier = String(req.body?.email || req.body?.identifier || "").trim();
    const email = normalizeEmail(identifier);
    const password = String(req.body?.password || "");

    if (identifier.length < 2 || identifier.length > 254 || password.length === 0 || password.length > 128) {
      return res.status(400).json({ error: "Invalid email or password format." });
    }

    let result;
    if (isValidEmail(email)) {
      result = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    } else {
      // Temporary migration path for accounts created before email login was introduced.
      const legacyUsername = normalizeUsername(identifier);
      result = await pool.query("SELECT * FROM users WHERE username = $1 AND email IS NULL", [legacyUsername]);
    }

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (!user.email && !user.email_verified) {
      // Legacy account migration: the password has been verified, so issue a short-lived
      // authenticated session that allows the owner to add and verify an email address.
      const progress = await pool.query("SELECT progress, updated_at FROM study_progress WHERE user_id = $1", [user.id]);
      const token = signUser(user.id);
      return res.json({
        token,
        account: publicUser(user),
        progress: progress.rows[0]?.progress ?? null,
        updatedAt: progress.rows[0]?.updated_at ?? null,
        emailRequired: true,
      });
    }
    if (emailVerificationEnabled && !user.email_verified) return res.status(403).json({ error: "Please verify your email address before signing in.", verificationRequired: true, email: user.email });

    const progress = await pool.query("SELECT progress, updated_at FROM study_progress WHERE user_id = $1", [user.id]);
    const token = signUser(user.id);
    return res.json({ token, account: publicUser(user), progress: progress.rows[0]?.progress ?? null, updatedAt: progress.rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error("login", error);
    return res.status(500).json({ error: "Unable to sign in." });
  }
});

app.put("/api/auth/email", auth, async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) return res.status(400).json({ error: "Please provide a valid email address." });

    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2",
      [email, req.user.id],
    );
    if (existing.rows[0]) return res.status(409).json({ error: "That email address is already registered." });

    const result = await pool.query(
      "UPDATE users SET email = $2, email_verified = FALSE WHERE id = $1 RETURNING id, student_name, username, email, email_verified, created_at",
      [req.user.id, email],
    );
    const code = await issueCode(email, "email-change", 10);
    await sendVerificationCode(email, "email-change", code);
    return res.json({ verificationRequired: true, email, account: publicUser(result.rows[0]) });
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ error: "That email address is already registered." });
    console.error("set email", error);
    return res.status(500).json({ error: "Unable to save the email address." });
  }
});


app.post("/api/auth/verify-email", async (req,res) => {
  if (!checkAuthRateLimit(req,res,"verify")) return;
  try {
    const email=normalizeEmail(req.body?.email), code=String(req.body?.code||"").trim();
    if(!isValidEmail(email)||!/^\d{6}$/.test(code)) return res.status(400).json({error:"Enter the 6-digit verification code."});
    const r=await pool.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1)",[email]), user=r.rows[0];
    if(!user||!(await verifyCode(email,"signup",code))) return res.status(400).json({error:"The verification code is invalid or expired."});
    const u=await pool.query("UPDATE users SET email_verified=TRUE WHERE id=$1 RETURNING id,student_name,username,email,email_verified,created_at",[user.id]);
    const p=await pool.query("SELECT progress,updated_at FROM study_progress WHERE user_id=$1",[user.id]);
    return res.json({token:signUser(user.id),account:publicUser(u.rows[0]),progress:p.rows[0]?.progress??null,updatedAt:p.rows[0]?.updated_at??null});
  } catch(error) { console.error("verify email",error); return res.status(500).json({error:"Unable to verify the email address."}); }
});
app.post("/api/auth/resend-verification", async (req,res) => {
  if (!checkAuthRateLimit(req,res,"code")) return;
  try {
    const email=normalizeEmail(req.body?.email);
    if(!isValidEmail(email)) return res.status(400).json({error:"Please provide a valid email address."});
    const r=await pool.query("SELECT email_verified FROM users WHERE LOWER(email)=LOWER($1)",[email]);
    if(!r.rows[0]||r.rows[0].email_verified) return res.json({ok:true});
    const code=await issueCode(email,"signup",10); await sendVerificationCode(email,"signup",code);
    return res.json({ok:true});
  } catch(error) { console.error("resend",error); return res.status(503).json({error:"Unable to send a verification code right now."}); }
});
app.post("/api/auth/forgot-password", async (req,res) => {
  if (!checkAuthRateLimit(req,res,"code")) return;
  try {
    const email=normalizeEmail(req.body?.email);
    const username=normalizeUsername(req.body?.username);
    const studentName=String(req.body?.studentName||"").trim();
    if(!isValidEmail(email)||username.length<2||studentName.length<2||studentName.length>80) {
      return res.status(400).json({error:"Enter your registered email, username and student name."});
    }
    const r=await pool.query(
      "SELECT id,student_name,username,email FROM users WHERE LOWER(email)=LOWER($1) AND username=$2 LIMIT 1",
      [email,username],
    );
    const user=r.rows[0];
    if(!user || user.student_name.trim().toLowerCase() !== studentName.toLowerCase()) {
      return res.status(400).json({error:"The account details could not be matched. Check your email, username and student name."});
    }
    return res.json({ok:true,message:"Account matched. You can now choose a new password.",recoveryReady:true});
  } catch(error) { console.error("forgot password",error); return res.status(500).json({error:"Unable to start account recovery."}); }
});
app.post("/api/auth/reset-password", async (req,res) => {
  if (!checkAuthRateLimit(req,res,"reset")) return;
  try {
    const email=normalizeEmail(req.body?.email);
    const username=normalizeUsername(req.body?.username);
    const studentName=String(req.body?.studentName||"").trim();
    const password=String(req.body?.password||"");
    if(!isValidEmail(email)||username.length<2||studentName.length<2||studentName.length>80||password.length<6||password.length>128)
      return res.status(400).json({error:"Enter your registered email, username, student name and a password of 6-128 characters."});
    const r=await pool.query(
      "SELECT * FROM users WHERE LOWER(email)=LOWER($1) AND username=$2 LIMIT 1",
      [email,username],
    );
    const user=r.rows[0];
    if(!user || user.student_name.trim().toLowerCase() !== studentName.toLowerCase())
      return res.status(400).json({error:"The account details could not be matched."});
    const hash=await bcrypt.hash(password,12);
    const u=await pool.query("UPDATE users SET password_hash=$2 WHERE id=$1 RETURNING id,student_name,username,email,email_verified,created_at",[user.id,hash]);
    const p=await pool.query("SELECT progress,updated_at FROM study_progress WHERE user_id=$1",[user.id]);
    return res.json({token:signUser(user.id),account:publicUser(u.rows[0]),progress:p.rows[0]?.progress??null,updatedAt:p.rows[0]?.updated_at??null});
  } catch(error) { console.error("reset password",error); return res.status(500).json({error:"Unable to reset the password."}); }
});


app.put("/api/auth/email", auth, async (req,res) => {
  try {
    const email=normalizeEmail(req.body?.email);
    if(!isValidEmail(email)) return res.status(400).json({error:"Please provide a valid email address."});
    const existing=await pool.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND id<>$2",[email,req.user.id]);
    if(existing.rows[0]) return res.status(409).json({error:"That email address is already registered."});
    const code=await issueCode(email,"email-change",10);
    await sendVerificationCode(email,"email-change",code);
    return res.json({verificationRequired:true,email});
  } catch(error) { console.error("set email",error); return res.status(503).json({error:"Unable to send the verification code right now."}); }
});
app.post("/api/auth/email/verify", auth, async (req,res) => {
  try {
    const email=normalizeEmail(req.body?.email), code=String(req.body?.code||"").trim();
    if(!isValidEmail(email)||!/^\d{6}$/.test(code)) return res.status(400).json({error:"Enter the 6-digit verification code."});
    const existing=await pool.query("SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND id<>$2",[email,req.user.id]);
    if(existing.rows[0]) return res.status(409).json({error:"That email address is already registered."});
    if(!(await verifyCode(email,"email-change",code))) return res.status(400).json({error:"The verification code is invalid or expired."});
    const result=await pool.query("UPDATE users SET email=$2,email_verified=TRUE WHERE id=$1 RETURNING id,student_name,username,email,email_verified,created_at",[req.user.id,email]);
    return res.json({account:publicUser(result.rows[0])});
  } catch(error) { console.error("verify account email",error); return res.status(500).json({error:"Unable to save the verified email address."}); }
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

app.post("/api/assessment/submit", auth, async (req, res) => {
  const type = String(req.body?.type || "").toUpperCase();
  const sessionId = String(req.body?.sessionId || "");
  const questionIds = Array.isArray(req.body?.questionIds) ? req.body.questionIds.map(value => String(value)) : [];
  const rawAnswers = req.body?.answers && typeof req.body.answers === "object" && !Array.isArray(req.body.answers) ? req.body.answers : null;

  if (!["RAT", "CAT", "REVISION"].includes(type)) {
    return res.status(400).json({ error: "Invalid assessment type." });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return res.status(400).json({ error: "Invalid assessment session." });
  }
  const expectedCount = type === "RAT" ? 10 : type === "CAT" ? 20 : null;
  if (!questionIds.length || questionIds.length > 100 || new Set(questionIds).size !== questionIds.length || (expectedCount !== null && questionIds.length !== expectedCount)) {
    return res.status(400).json({ error: "Invalid assessment questions." });
  }
  if (!rawAnswers) return res.status(400).json({ error: "Assessment answers are required." });

  if (type === "REVISION") {
    const missed = await pool.query(
      "SELECT DISTINCT jsonb_array_elements_text(COALESCE(result->'missedQuestionIds', '[]'::jsonb)) AS question_id FROM assessment_submissions WHERE user_id = $1 AND result IS NOT NULL",
      [req.user.id],
    );
    const authoritativeMissed = new Set(missed.rows.map(row => row.question_id));
    if (questionIds.some(id => !authoritativeMissed.has(id))) {
      return res.status(400).json({ error: "Revision contains a question that has not been officially missed." });
    }
  }

  const answers = {};
  for (const id of questionIds) {
    const expected = QUESTION_ANSWER_KEY[id];
    if (typeof expected !== "number") return res.status(400).json({ error: "Assessment contains an unknown question." });
    const value = rawAnswers[id];
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      return res.status(400).json({ error: "Assessment contains an invalid answer." });
    }
    answers[id] = value;
  }

  const correctQuestionIds = questionIds.filter(id => answers[id] === QUESTION_ANSWER_KEY[id]);
  const missedQuestionIds = questionIds.filter(id => answers[id] !== QUESTION_ANSWER_KEY[id]);
  const correct = correctQuestionIds.length;
  const total = questionIds.length;
  const pointsPerCorrect = type === "REVISION" ? 2 : type === "RAT" ? 5 : 10;
  const passmark = type === "REVISION" ? null : 50;
  const score = correct * pointsPerCorrect;
  const accuracy = Math.round((correct / total) * 100);
  const result = {
    type,
    sessionId,
    questionIds,
    correctQuestionIds,
    missedQuestionIds,
    correct,
    total,
    score,
    accuracy,
    passed: passmark === null ? true : accuracy >= passmark,
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const verifiedState = await client.query("SELECT points FROM verified_account_state WHERE user_id = $1 FOR UPDATE", [req.user.id]);
    if (!verifiedState.rows[0]) await client.query("INSERT INTO verified_account_state (user_id, points) VALUES ($1, 0)", [req.user.id]);
    const currentVerifiedPoints = Number(verifiedState.rows[0]?.points ?? 0);
    const nextVerifiedPoints = currentVerifiedPoints + score;

    const existing = await client.query(
      "SELECT assessment_type, result, submitted_at FROM assessment_submissions WHERE user_id = $1 AND session_id = $2 FOR UPDATE",
      [req.user.id, sessionId],
    );

    if (existing.rows[0] && existing.rows[0].assessment_type !== type) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Assessment session does not match its stored submission." });
    }

    if (existing.rows[0]?.result) {
      const updated = await client.query("SELECT updated_at FROM study_progress WHERE user_id = $1", [req.user.id]);
      await client.query("COMMIT");
      return res.json({
        accepted: true,
        duplicate: true,
        submittedAt: existing.rows[0].submitted_at,
        updatedAt: updated.rows[0]?.updated_at ?? null,
        result: existing.rows[0].result,
      });
    }

    const submittedAt = existing.rows[0]?.submitted_at ?? new Date().toISOString();
    if (existing.rows[0]) {
      await client.query(
        "UPDATE assessment_submissions SET result = $3::jsonb WHERE user_id = $1 AND session_id = $2",
        [req.user.id, sessionId, JSON.stringify(result)],
      );
    } else {
      await client.query(
        `INSERT INTO assessment_submissions (user_id, session_id, assessment_type, result)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [req.user.id, sessionId, type, JSON.stringify(result)],
      );
    }

    const storedProgress = await client.query(
      "SELECT progress FROM study_progress WHERE user_id = $1 FOR UPDATE",
      [req.user.id],
    );
    const baseProgress = storedProgress.rows[0]?.progress && typeof storedProgress.rows[0].progress === "object"
      ? storedProgress.rows[0].progress
      : {};
    const mergedProgress = { ...baseProgress, points: nextVerifiedPoints };

    await client.query(
      `INSERT INTO study_progress (user_id, progress, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET progress = EXCLUDED.progress, updated_at = NOW()`,
      [req.user.id, JSON.stringify(mergedProgress)],
    );
    await client.query("UPDATE verified_account_state SET points = $2, updated_at = NOW() WHERE user_id = $1", [req.user.id, nextVerifiedPoints]);
    const updated = await client.query("SELECT updated_at FROM study_progress WHERE user_id = $1", [req.user.id]);
    await client.query("COMMIT");
    return res.json({ accepted: true, duplicate: false, submittedAt, updatedAt: updated.rows[0]?.updated_at ?? null, result });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("assessment submit", error);
    return res.status(500).json({ error: "Assessment submission could not be verified." });
  } finally {
    client.release();
  }
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

  const verified = await pool.query("SELECT points FROM verified_account_state WHERE user_id = $1", [req.user.id]);
  const verifiedPoints = Number(verified.rows[0]?.points ?? 0);
  const submittedPoints = Number(req.body.progress.points);
  if (!Number.isInteger(submittedPoints) || submittedPoints !== verifiedPoints) {
    const latest = await pool.query("SELECT progress, updated_at FROM study_progress WHERE user_id = $1", [req.user.id]);
    return res.status(409).json({ error: "Progress points do not match the server-verified total.", progress: latest.rows[0]?.progress ?? { points: verifiedPoints }, updatedAt: latest.rows[0]?.updated_at ?? null });
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

  const latest = await pool.query(
    "SELECT progress, updated_at FROM study_progress WHERE user_id = $1",
    [req.user.id],
  );
  return res.status(409).json({
    error: "Cloud progress is newer than this device.",
    progress: latest.rows[0]?.progress ?? null,
    updatedAt: latest.rows[0]?.updated_at ?? null,
  });
});

app.listen(port, () => console.log(`Biology-Study API listening on port ${port}`));
