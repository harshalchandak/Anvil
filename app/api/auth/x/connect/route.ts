import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildAuthorizeUrl,
  generateOAuthState,
  generatePkcePair,
} from "@/clients/x";
import { requireAuthUser } from "@/lib/auth";
import { env, isXConfigured } from "@/lib/env";

const COOKIE_VERIFIER = "x_oauth_verifier";
const COOKIE_STATE = "x_oauth_state";
const TEN_MINUTES = 60 * 10;

export async function GET() {
  await requireAuthUser();

  // If X creds are still placeholders, route the user to our demo-connect
  // page instead of dumping them in a broken OAuth flow. They type the
  // handle they want to test as; the rest of the app behaves as if they
  // connected for real. The moment real creds are set, this branch is
  // skipped and real OAuth runs.
  if (!isXConfigured()) {
    return NextResponse.redirect(new URL("/connect-x", env.NEXT_PUBLIC_APP_URL));
  }

  const { verifier, challenge } = generatePkcePair();
  const state = generateOAuthState();
  const url = buildAuthorizeUrl({ state, codeChallenge: challenge });

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TEN_MINUTES,
  };
  cookieStore.set(COOKIE_VERIFIER, verifier, cookieOpts);
  cookieStore.set(COOKIE_STATE, state, cookieOpts);

  return NextResponse.redirect(url);
}
