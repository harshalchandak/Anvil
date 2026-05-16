import "server-only";
import { hmacSign, hmacVerify } from "@/lib/crypto";
import { env } from "@/lib/env";

const TTL_MS = 5 * 60 * 1000;

function payload(carouselId: string, slideNumber: number, exp: number) {
  return `${carouselId}:${slideNumber}:${exp}`;
}

export function issueRenderToken(carouselId: string, slideNumber: number): string {
  const exp = Date.now() + TTL_MS;
  const sig = hmacSign(payload(carouselId, slideNumber, exp), env.WEBHOOK_SIGNING_SECRET);
  return `${exp}.${sig}`;
}

export function verifyRenderToken(
  token: string,
  carouselId: string,
  slideNumber: number,
): boolean {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number.parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return hmacVerify(payload(carouselId, slideNumber, exp), sig, env.WEBHOOK_SIGNING_SECRET);
}
