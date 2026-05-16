#!/usr/bin/env node
/**
 * Fire a signed POST against the /api/webhooks/content-trigger endpoint
 * for local development. Usage:
 *
 *   pnpm tsx scripts/trigger-webhook.ts <brandProfileId> [niche] [goal]
 *
 * Reads WEBHOOK_SIGNING_SECRET and APP_URL from .env.local.
 */
import "dotenv/config";
import { createHmac } from "node:crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SECRET = process.env.WEBHOOK_SIGNING_SECRET;
if (!SECRET) {
  console.error("WEBHOOK_SIGNING_SECRET is not set in environment");
  process.exit(2);
}

const [brandProfileId, niche, goal] = process.argv.slice(2);
if (!brandProfileId) {
  console.error(
    "Usage: pnpm tsx scripts/trigger-webhook.ts <brandProfileId> [niche] [goal]",
  );
  process.exit(2);
}

const payload = {
  brandProfileId,
  triggerSource: "cli",
  ...(niche ? { niche } : {}),
  ...(goal ? { goal } : {}),
};
const body = JSON.stringify(payload);
const signature = createHmac("sha256", SECRET).update(body, "utf8").digest("hex");

const url = `${APP_URL.replace(/\/$/, "")}/api/webhooks/content-trigger`;

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-netisize-signature": signature,
    },
    body,
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(text);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
