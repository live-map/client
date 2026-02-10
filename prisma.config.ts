import "dotenv/config";
import { defineConfig } from "prisma/config";

// DIRECT_URL 우선, 없으면 DATABASE_URL fallback
const databaseUrl = process.env.SESSION_POOLER_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",

  // db push, migrate는 DIRECT_URL 사용 (pooler는 migration에서 hang 발생)
  datasource: {
    url: databaseUrl,
  },
});
