// Prisma 7 config: used by the Prisma CLI (migrate, studio, generate) to
// find the schema and connect to the database. Not used at runtime by the
// app itself - PrismaClient is instantiated with a driver adapter instead
// (see lib/prisma.ts) since Prisma 7 no longer reads a datasource `url`
// from schema.prisma.
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Prisma 7's config loader does not auto-load .env the way earlier CLI
// versions did, so load it explicitly before env() resolves DATABASE_URL.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
