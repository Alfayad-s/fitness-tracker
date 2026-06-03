import { logDbError, toDbError, type DbResult } from "@/lib/db/errors";

/** Run a DB read; on failure log and return fallback (avoids crashing RSC pages). */
export async function withDbFallback<T>(
  context: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logDbError(context, error);
    return fallback;
  }
}

/** Like {@link withDbFallback} but returns a typed {@link DbResult}. */
export async function withDbResult<T>(
  context: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<DbResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const dbError = toDbError(context, error);
    logDbError(context, dbError);
    return { ok: false, error: dbError };
  }
}
