export const DB_POOLER_HINT =
  "Use Supabase Transaction pooler (port 6543) in DATABASE_URL — see docs/supabase-drizzle-database.md";

export type DbErrorCode =
  | "NOT_FOUND"
  | "UNAVAILABLE"
  | "CONSTRAINT"
  | "UNKNOWN";

export type DbResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DbError };

export class DbError extends Error {
  readonly code: DbErrorCode;
  readonly context: string;

  constructor(
    code: DbErrorCode,
    message: string,
    context: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "DbError";
    this.code = code;
    this.context = context;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }

  get userMessage(): string {
    switch (this.code) {
      case "NOT_FOUND":
        return "That record was not found.";
      case "UNAVAILABLE":
        return this.message.includes("npm run db:migrate")
          ? this.message
          : "Database is temporarily unavailable. Try again in a moment.";
      case "CONSTRAINT":
        return "This change conflicts with existing data.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
}

export function isDbConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const record = error as { code?: string; message?: string; cause?: unknown };
  if (record.code === "53300" || record.code === "ECONNREFUSED") {
    return true;
  }

  const message = String(record.message ?? "");
  if (
    message.includes("connection slots") ||
    message.includes("Failed query") ||
    message.includes("ECONNREFUSED")
  ) {
    return true;
  }

  if (record.cause) {
    return isDbConnectionError(record.cause);
  }

  return false;
}

export function isPostgresMissingRelation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string; cause?: unknown };
  if (record.code === "42P01") return true;
  const message = String(record.message ?? "");
  if (message.includes("does not exist") && message.includes("relation")) {
    return true;
  }
  if (record.cause) return isPostgresMissingRelation(record.cause);
  return false;
}

export const DB_MIGRATION_HINT =
  "Nutrition tables are missing. Run: npm run db:migrate";

export function isPostgresUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; cause?: unknown };
  if (record.code === "23505") return true;
  if (record.cause) return isPostgresUniqueViolation(record.cause);
  return false;
}

export function toDbError(context: string, error: unknown): DbError {
  if (error instanceof DbError) return error;

  if (isDbConnectionError(error)) {
    return new DbError(
      "UNAVAILABLE",
      "Database connection failed",
      context,
      error,
    );
  }

  if (isPostgresUniqueViolation(error)) {
    return new DbError(
      "CONSTRAINT",
      "Unique constraint violation",
      context,
      error,
    );
  }

  if (isPostgresMissingRelation(error)) {
    return new DbError(
      "UNAVAILABLE",
      DB_MIGRATION_HINT,
      context,
      error,
    );
  }

  const message =
    error instanceof Error ? error.message : "Unknown database error";
  return new DbError("UNKNOWN", message, context, error);
}

export function dbOk<T>(data: T): DbResult<T> {
  return { ok: true, data };
}

export function dbFail<T>(error: DbError): DbResult<T> {
  return { ok: false, error };
}

export function logDbError(context: string, error: unknown): void {
  if (isDbConnectionError(error)) {
    console.error(`[${context}] ${DB_POOLER_HINT}`, error);
    return;
  }
  console.error(`[${context}]`, error);
}

/** Run a query; returns typed result instead of throwing. */
export async function runDbResult<T>(
  context: string,
  fn: () => Promise<T>,
): Promise<DbResult<T>> {
  try {
    return dbOk(await fn());
  } catch (error) {
    const dbError = toDbError(context, error);
    logDbError(context, dbError);
    return dbFail(dbError);
  }
}

/** Run a query; throws {@link DbError} on failure. */
export async function runDb<T>(
  context: string,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await runDbResult(context, fn);
  if (!result.ok) {
    throw result.error;
  }
  return result.data;
}
