import "server-only";
import { cookies } from "next/headers";
import { hmacSign, hmacVerify } from "@/lib/crypto";
import { env } from "@/lib/env";

const COOKIE = "netisize_demo_brand";
const TTL_DAYS = 90;

export type DemoBrand = {
  id: string;
  niche: string;
  audience: string;
  goal: string;
  tone: string;
  frequency: string;
  approvalMode: "manual" | "autopilot";
  sampleStyle: string;
  bannedWords: string[];
  competitors: string[];
  ctaPreference: string;
  updatedAtIso: string;
};

function encode(value: DemoBrand, exp: number): string {
  const body = JSON.stringify({ ...value, exp });
  const sig = hmacSign(body, env.WEBHOOK_SIGNING_SECRET);
  return Buffer.from(`${body}.${sig}`, "utf8").toString("base64url");
}

function decode(raw: string): DemoBrand | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot <= 0) return null;
    const body = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    if (!hmacVerify(body, sig, env.WEBHOOK_SIGNING_SECRET)) return null;
    const parsed = JSON.parse(body) as DemoBrand & { exp: number };
    if (
      !Number.isFinite(parsed.exp) ||
      parsed.exp < Date.now()
    ) {
      return null;
    }
    // Strip the exp before returning.
    const { exp: _exp, ...rest } = parsed;
    void _exp;
    return rest;
  } catch {
    return null;
  }
}

/**
 * Persist a brand profile via cookie when the real Postgres write isn't
 * available (demo mode). Survives refresh + restart, 90-day TTL.
 */
export async function setDemoBrand(value: Omit<DemoBrand, "updatedAtIso">) {
  const exp = Date.now() + TTL_DAYS * 86400 * 1000;
  const v: DemoBrand = { ...value, updatedAtIso: new Date().toISOString() };
  const encoded = encode(v, exp);
  const store = await cookies();
  store.set(COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  });
  return v;
}

export async function getDemoBrand(): Promise<DemoBrand | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  return raw ? decode(raw) : null;
}

export async function clearDemoBrand() {
  const store = await cookies();
  store.delete(COOKIE);
}
