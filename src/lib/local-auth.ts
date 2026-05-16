import "server-only";
import { cookies } from "next/headers";
import { hmacSign, hmacVerify } from "@/lib/crypto";
import { env } from "@/lib/env";

const COOKIE = "netisize_local_session";
const TTL_DAYS = 7;

export type LocalSession = {
  email: string;
  /** App-user UUID. Deterministically derived from email so reloads stay logged in. */
  appUserId: string;
  /** Display name, defaulted from the email local part. */
  displayName: string;
};

function token(payload: LocalSession, exp: number): string {
  const body = `${payload.email}|${payload.appUserId}|${payload.displayName}|${exp}`;
  const sig = hmacSign(body, env.WEBHOOK_SIGNING_SECRET);
  return Buffer.from(`${body}.${sig}`, "utf8").toString("base64url");
}

function parse(raw: string): { session: LocalSession; exp: number } | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot <= 0) return null;
    const body = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    if (!hmacVerify(body, sig, env.WEBHOOK_SIGNING_SECRET)) return null;
    const [email, appUserId, displayName, expStr] = body.split("|");
    if (!email || !appUserId || !expStr) return null;
    const exp = Number.parseInt(expStr, 10);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    return {
      session: { email, appUserId, displayName: displayName || email },
      exp,
    };
  } catch {
    return null;
  }
}

/**
 * Deterministic UUID-shaped string for an email. Uses HMAC over the email
 * so the same email always lands on the same app-user id within a single
 * deployment. Not cryptographically meaningful — just a stable handle.
 */
function appUserIdFor(email: string): string {
  const h = hmacSign(`app-user:${email.toLowerCase()}`, env.WEBHOOK_SIGNING_SECRET);
  // Format the first 32 hex chars as a UUID v4-ish string.
  return (
    h.slice(0, 8) +
    "-" +
    h.slice(8, 12) +
    "-4" +
    h.slice(13, 16) +
    "-a" +
    h.slice(17, 20) +
    "-" +
    h.slice(20, 32)
  );
}

export async function setLocalSession(email: string) {
  const normalised = email.trim().toLowerCase();
  const displayName = normalised.split("@")[0] ?? normalised;
  const session: LocalSession = {
    email: normalised,
    appUserId: appUserIdFor(normalised),
    displayName,
  };
  const exp = Date.now() + TTL_DAYS * 86400 * 1000;
  const value = token(session, exp);

  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  });
  return session;
}

export async function getLocalSession(): Promise<LocalSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const parsed = parse(raw);
  return parsed ? parsed.session : null;
}

export async function clearLocalSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
