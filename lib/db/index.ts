import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

if (
  process.env.NODE_ENV === "development" &&
  connectionString.includes(":5432") &&
  !connectionString.includes("pooler.supabase.com")
) {
  console.warn(
    "[db] DATABASE_URL uses direct port 5432. Switch to Supabase Transaction pooler (6543) to avoid connection limit errors.",
  );
}

type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  postgresClient: PostgresClient | undefined;
};

function poolMax(): number {
  const fromEnv = process.env.DATABASE_POOL_MAX;
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return process.env.NODE_ENV === "production" ? 1 : 3;
}

function createPostgresClient(): PostgresClient {
  return postgres(connectionString!, {
    prepare: false,
    max: poolMax(),
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

/** Reuse one pool in dev so Next.js HMR does not exhaust Supabase connection slots. */
const client = globalForDb.postgresClient ?? createPostgresClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });

export type Database = typeof db;
