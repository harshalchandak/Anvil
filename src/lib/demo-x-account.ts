import "server-only";
import { cookies } from "next/headers";
import { hmacSign, hmacVerify } from "@/lib/crypto";
import { env } from "@/lib/env";

const COOKIE = "netisize_demo_x_account";
const TTL_DAYS = 30;

export type DemoXAccount = {
  xUserId: string;
  xUsername: string;
  connectedAtIso: string;
};

function encode(value: DemoXAccount, exp: number): string {
  const body = `${value.xUserId}|${value.xUsername}|${value.connectedAtIso}|${exp}`;
  const sig = hmacSign(body, env.WEBHOOK_SIGNING_SECRET);
  return Buffer.from(`${body}.${sig}`, "utf8").toString("base64url");
}

function decode(raw: string): DemoXAccount | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot <= 0) return null;
    const body = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    if (!hmacVerify(body, sig, env.WEBHOOK_SIGNING_SECRET)) return null;
    const [xUserId, xUsername, connectedAtIso, expStr] = body.split("|");
    if (!xUserId || !xUsername || !connectedAtIso || !expStr) return null;
    const exp = Number.parseInt(expStr, 10);
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    return { xUserId, xUsername, connectedAtIso };
  } catch {
    return null;
  }
}

/**
 * Set the demo-mode X account cookie. Used by the OAuth callback when the
 * real Postgres write isn't available (placeholder env).
 */
export async function setDemoXAccount(args: {
  xUserId: string;
  xUsername: string;
}) {
  const exp = Date.now() + TTL_DAYS * 86400 * 1000;
  const value = encode(
    {
      xUserId: args.xUserId,
      xUsername: args.xUsername,
      connectedAtIso: new Date().toISOString(),
    },
    exp,
  );
  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  });
}

export async function getDemoXAccount(): Promise<DemoXAccount | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export async function clearDemoXAccount() {
  const store = await cookies();
  store.delete(COOKIE);
}
