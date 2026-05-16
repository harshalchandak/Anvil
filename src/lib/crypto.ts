import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "@/lib/env";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard
const TAG_BYTES = 16;
const KEY_BYTES = 32;

let cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const buf = Buffer.from(env.TOKEN_ENCRYPTION_KEY, "hex");
  if (buf.length !== KEY_BYTES) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  cachedKey = buf;
  return buf;
}

/**
 * AES-256-GCM encrypt. Output format: `v1:<ivHex>:<ciphertextHex>:<tagHex>`.
 * The version prefix gives us a migration path if we ever rotate algorithms.
 */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  if (tag.length !== TAG_BYTES) {
    throw new Error("Unexpected GCM tag length");
  }
  return `v1:${iv.toString("hex")}:${ct.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptToken(encoded: string): string {
  const parts = encoded.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Malformed encrypted token (expected v1:iv:ct:tag)");
  }
  const [, ivHex, ctHex, tagHex] = parts as [string, string, string, string];
  const iv = Buffer.from(ivHex, "hex");
  const ct = Buffer.from(ctHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  if (iv.length !== IV_BYTES) throw new Error("Bad IV length");
  if (tag.length !== TAG_BYTES) throw new Error("Bad tag length");
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/**
 * Webhook signature helpers. Used by /api/webhooks/* to verify HMAC-SHA256
 * signatures over the raw request body.
 */
export function hmacSign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

export function hmacVerify(body: string, signatureHex: string, secret: string): boolean {
  const expected = Buffer.from(hmacSign(body, secret), "hex");
  let actual: Buffer;
  try {
    actual = Buffer.from(signatureHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
