import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { xAccounts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import { exchangeAuthorizationCode, fetchXUserMe } from "@/clients/x";
import { isPlaceholderEnv } from "@/lib/env";
import { setDemoXAccount } from "@/lib/demo-x-account";

const COOKIE_VERIFIER = "x_oauth_verifier";
const COOKIE_STATE = "x_oauth_state";

export async function GET(request: NextRequest) {
  const { appUser } = await requireAppUser();

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateFromQuery = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?x_error=${encodeURIComponent(error)}`, request.url),
    );
  }
  if (!code || !stateFromQuery) {
    return NextResponse.redirect(
      new URL("/settings?x_error=missing_code_or_state", request.url),
    );
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get(COOKIE_VERIFIER)?.value;
  const stateFromCookie = cookieStore.get(COOKIE_STATE)?.value;

  // Clean up one-shot cookies regardless of outcome.
  cookieStore.delete(COOKIE_VERIFIER);
  cookieStore.delete(COOKIE_STATE);

  if (!verifier || !stateFromCookie) {
    return NextResponse.redirect(
      new URL("/settings?x_error=missing_pkce_cookie", request.url),
    );
  }
  if (stateFromCookie !== stateFromQuery) {
    return NextResponse.redirect(
      new URL("/settings?x_error=state_mismatch", request.url),
    );
  }

  try {
    const token = await exchangeAuthorizationCode({
      code,
      codeVerifier: verifier,
    });
    const me = await fetchXUserMe(token.access_token);

    // Try to persist to Postgres. If we're in demo mode (placeholder
    // DATABASE_URL), the write throws — fall back to a signed cookie so the
    // dashboard can still display the connection.
    let persistedToDb = false;
    if (!isPlaceholderEnv()) {
      try {
        const expiresAt = new Date(Date.now() + token.expires_in * 1000);
        const scopes = token.scope.split(/\s+/).filter(Boolean);
        const accessTokenEncrypted = encryptToken(token.access_token);
        const refreshTokenEncrypted = encryptToken(token.refresh_token);

        const existing = await db
          .select({ id: xAccounts.id })
          .from(xAccounts)
          .where(eq(xAccounts.userId, appUser.id))
          .limit(1);

        if (existing[0]) {
          await db
            .update(xAccounts)
            .set({
              xUserId: me.id,
              xUsername: me.username,
              accessTokenEncrypted,
              refreshTokenEncrypted,
              expiresAt,
              scopes,
              invalid: false,
              lastRefreshError: null,
              updatedAt: new Date(),
            })
            .where(eq(xAccounts.id, existing[0].id));
        } else {
          await db.insert(xAccounts).values({
            userId: appUser.id,
            xUserId: me.id,
            xUsername: me.username,
            accessTokenEncrypted,
            refreshTokenEncrypted,
            expiresAt,
            scopes,
          });
        }
        persistedToDb = true;
      } catch (dbErr) {
        // Fall through to cookie persistence.
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[netisize] X account DB write failed, falling back to demo cookie:",
            dbErr instanceof Error ? dbErr.message : String(dbErr),
          );
        }
      }
    }

    if (!persistedToDb) {
      await setDemoXAccount({ xUserId: me.id, xUsername: me.username });
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard?x_connected=1&x_username=${encodeURIComponent(me.username)}`,
        request.url,
      ),
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(
      new URL(`/settings?x_error=${encodeURIComponent(reason)}`, request.url),
    );
  }
}
