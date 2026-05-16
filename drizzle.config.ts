import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// `generate` (offline diff) does not require a live DB. `push` / `migrate` do.
// We supply a placeholder so the schemaless commands work without a .env present.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
