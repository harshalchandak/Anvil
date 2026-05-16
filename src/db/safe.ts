import "server-only";
import { isPlaceholderEnv } from "@/lib/env";

/**
 * Run a DB-backed query and return the supplied fallback if it fails OR if
 * we're in demo mode (no real DATABASE_URL configured). Lets server pages
 * render an empty state instead of crashing the whole route during local
 * exploration.
 */
export async function tryDbQuery<T>(
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  if (isPlaceholderEnv()) return fallback;
  try {
    return await run();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[netisize] DB query failed, falling back to empty:",
        err instanceof Error ? err.message : String(err),
      );
    }
    return fallback;
  }
}
