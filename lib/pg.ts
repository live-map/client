import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.SESSION_POOLER_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
