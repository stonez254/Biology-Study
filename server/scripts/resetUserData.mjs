import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const client = await pool.connect();

try {
  await client.query("BEGIN");

  // Wipe user/account data and all user-linked learning state.
  // Keep question_bank_items intact because it is application content, not user data.
  await client.query(`
    TRUNCATE TABLE
      email_verification_codes,
      assessment_states,
      assessment_submissions,
      study_progress,
      verified_account_state,
      users
    RESTART IDENTITY CASCADE
  `);

  await client.query("COMMIT");
  console.log("Database reset complete: all accounts and synced user progress were deleted.");
  console.log("Question-bank content was preserved.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Database reset failed:", error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
