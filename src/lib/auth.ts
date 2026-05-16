import "server-only";
import { redirect } from "next/navigation";
import type { User as AuthUser } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env, isPlaceholderEnv } from "@/lib/env";
import { getLocalSession } from "@/lib/local-auth";

export type AppUser = typeof users.$inferSelect;

/**
 * Return the current auth user, or null if unauthenticated. In demo mode
 * (placeholder Supabase env) this reads our local HMAC cookie instead of
 * hitting Supabase — so the UI can be explored without any external service.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (isPlaceholderEnv()) {
    const session = await getLocalSession();
    if (!session) return null;
    return synthesizeAuthUser(session.appUserId, session.email, session.displayName);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

function synthesizeAuthUser(
  id: string,
  email: string,
  displayName: string,
): AuthUser {
  // Minimal shape sufficient for our code-paths (we only read id, email,
  // user_metadata.name in ensureAppUser).
  return {
    id,
    email,
    user_metadata: { full_name: displayName, name: displayName },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as AuthUser;
}

function synthesizeAppUser(authUser: AuthUser): AppUser {
  return {
    id: authUser.id,
    authUserId: authUser.id,
    email: authUser.email ?? null,
    displayName:
      (authUser.user_metadata?.["full_name"] as string | undefined) ??
      (authUser.user_metadata?.["name"] as string | undefined) ??
      authUser.email ??
      null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Mirror a Supabase auth.users row into public.users. In demo mode this
 * returns an in-memory user record (no DB write) so the (app) layout can
 * render without a live Postgres.
 */
export async function ensureAppUser(authUser: AuthUser): Promise<AppUser> {
  if (isPlaceholderEnv()) return synthesizeAppUser(authUser);

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUser.id))
      .limit(1);

    const existingRow = existing[0];
    if (existingRow) return existingRow;

    const inserted = await db
      .insert(users)
      .values({
        authUserId: authUser.id,
        email: authUser.email ?? null,
        displayName:
          (authUser.user_metadata?.["full_name"] as string | undefined) ??
          (authUser.user_metadata?.["name"] as string | undefined) ??
          null,
      })
      .onConflictDoNothing({ target: users.authUserId })
      .returning();

    const row = inserted[0];
    if (row) return row;

    const reread = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUser.id))
      .limit(1);
    const rereadRow = reread[0];
    if (!rereadRow) {
      throw new Error(
        `ensureAppUser: insert returned no row and re-read failed for auth user ${authUser.id}`,
      );
    }
    return rereadRow;
  } catch (err) {
    // If the DB isn't reachable (e.g. user hasn't set DATABASE_URL yet),
    // degrade to a synthesized in-memory user. We log it so a real prod
    // outage is still visible.
    if (env.NODE_ENV !== "production") {
      console.warn(
        "[netisize] ensureAppUser DB write failed, returning in-memory user:",
        err instanceof Error ? err.message : String(err),
      );
      return synthesizeAppUser(authUser);
    }
    throw err;
  }
}

export async function requireAppUser(): Promise<{
  authUser: AuthUser;
  appUser: AppUser;
}> {
  const authUser = await requireAuthUser();
  const appUser = await ensureAppUser(authUser);
  return { authUser, appUser };
}
