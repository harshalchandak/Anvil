import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { schema } from "@/db/schema";

// Single shared connection pool. The Inngest worker and Next.js server
// runtimes import this module — keep one pool per process.
const globalForPg = globalThis as unknown as {
  __netisizePg?: ReturnType<typeof postgres>;
};

const client =
  globalForPg.__netisizePg ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 30,
    prepare: false, // Supabase pgbouncer / transaction-mode safety
  });

if (env.NODE_ENV !== "production") {
  globalForPg.__netisizePg = client;
}

export const db = drizzle(client, { schema, logger: env.NODE_ENV === "development" });

export type DB = typeof db;
