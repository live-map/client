import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.SESSION_POOLER_URL || process.env.DATABASE_URL,
});

export default pool;
