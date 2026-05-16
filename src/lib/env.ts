import { z } from "zod";

const required = (name: string) =>
  z
    .string({ message: `Missing required env var: ${name}` })
    .trim()
    .min(1, `Missing required env var: ${name}`);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  NEXT_PUBLIC_APP_URL: required("NEXT_PUBLIC_APP_URL").url(),

  NEXT_PUBLIC_SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL").url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  DATABASE_URL: required("DATABASE_URL"),

  ANTHROPIC_API_KEY: required("ANTHROPIC_API_KEY"),
  // Optional — set to use Grok / xAI models. Routed automatically when
  // LLM_MODEL starts with "grok-".
  XAI_API_KEY: z.string().trim().optional(),
  LLM_MODEL: z.string().trim().min(1).default("claude-sonnet-4-5"),

  TAVILY_API_KEY: required("TAVILY_API_KEY"),

  X_CLIENT_ID: required("X_CLIENT_ID"),
  X_CLIENT_SECRET: required("X_CLIENT_SECRET"),
  X_OAUTH_REDIRECT_URI: required("X_OAUTH_REDIRECT_URI").url(),
  X_OAUTH_SCOPES: z
    .string()
    .trim()
    .min(1)
    .default("tweet.read tweet.write users.read offline.access"),

  INNGEST_EVENT_KEY: required("INNGEST_EVENT_KEY"),
  INNGEST_SIGNING_KEY: required("INNGEST_SIGNING_KEY"),

  TOKEN_ENCRYPTION_KEY: required("TOKEN_ENCRYPTION_KEY").regex(
    /^[0-9a-fA-F]{64}$/,
    "TOKEN_ENCRYPTION_KEY must be 32-byte hex (64 hex chars)",
  ),

  WEBHOOK_SIGNING_SECRET: required("WEBHOOK_SIGNING_SECRET"),

  ENABLE_REAL_PUBLISHING: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

// Strict validation only when we're actually starting in production.
// In `next build` (page-data collection) and in dev (so the unauthenticated
// landing page can render before the user configures Supabase/Anthropic/X),
// fall back to safe placeholders. Any code that *uses* one of these keys
// against a live service still fails clearly at point-of-use.
const PHASE = process.env.NEXT_PHASE;
const isBuildPhase = PHASE === "phase-production-build";
const isProdRuntime =
  process.env.NODE_ENV === "production" &&
  PHASE !== "phase-production-build" &&
  PHASE !== "phase-development-server";

function placeholderEnv(): Env {
  return {
    NODE_ENV:
      (process.env.NODE_ENV as Env["NODE_ENV"] | undefined) ?? "development",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
    DATABASE_URL:
      process.env.DATABASE_URL ||
      "postgres://placeholder:placeholder@localhost:5432/placeholder",
    ANTHROPIC_API_KEY:
      process.env.ANTHROPIC_API_KEY || "placeholder-anthropic-key",
    XAI_API_KEY: process.env.XAI_API_KEY || undefined,
    LLM_MODEL: process.env.LLM_MODEL || "claude-sonnet-4-5",
    TAVILY_API_KEY: process.env.TAVILY_API_KEY || "placeholder-tavily-key",
    X_CLIENT_ID: process.env.X_CLIENT_ID || "placeholder-x-client-id",
    X_CLIENT_SECRET:
      process.env.X_CLIENT_SECRET || "placeholder-x-client-secret",
    X_OAUTH_REDIRECT_URI:
      process.env.X_OAUTH_REDIRECT_URI ||
      "http://localhost:3000/api/auth/x/callback",
    X_OAUTH_SCOPES:
      process.env.X_OAUTH_SCOPES ||
      "tweet.read tweet.write users.read offline.access",
    INNGEST_EVENT_KEY:
      process.env.INNGEST_EVENT_KEY || "placeholder-inngest-event-key",
    INNGEST_SIGNING_KEY:
      process.env.INNGEST_SIGNING_KEY ||
      "signkey-placeholder-0000000000000000000000000000000000000000000000",
    TOKEN_ENCRYPTION_KEY:
      process.env.TOKEN_ENCRYPTION_KEY &&
      /^[0-9a-fA-F]{64}$/.test(process.env.TOKEN_ENCRYPTION_KEY)
        ? process.env.TOKEN_ENCRYPTION_KEY
        : "0".repeat(64),
    WEBHOOK_SIGNING_SECRET:
      process.env.WEBHOOK_SIGNING_SECRET || "placeholder-webhook-secret",
    ENABLE_REAL_PUBLISHING: process.env.ENABLE_REAL_PUBLISHING === "true",
  };
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  // In real production runtime: fail fast and loud.
  if (isProdRuntime) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nSee .env.example for the full list of required variables.`,
    );
  }

  // Build / dev: fill missing keys with placeholders so the bundle compiles
  // and the dev server boots. We log the missing keys once so devs see
  // exactly what's not configured.
  const missing = parsed.error.issues
    .map((i) => i.path.join(".") || "(root)")
    .filter((k, i, arr) => arr.indexOf(k) === i);
  if (!isBuildPhase && missing.length > 0 && typeof console !== "undefined") {
    console.warn(
      `[netisize] dev placeholders in use for ${missing.length} env var(s): ${missing.join(", ")}. Live services that depend on these will fail at point-of-use until you fill them in .env.local.`,
    );
  }
  return placeholderEnv();
}

export const env: Env = loadEnv();

/**
 * True when any of the required external services is still on a dev
 * placeholder. Used by helpers that want to fall back to a fully local mode
 * (cookie-based auth, empty DB results) so the UI can still be explored.
 */
export function isPlaceholderEnv(): boolean {
  return (
    env.NEXT_PUBLIC_SUPABASE_URL === "http://localhost:54321" ||
    env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-role-key" ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder-anon-key" ||
    env.DATABASE_URL.includes("placeholder")
  );
}

/**
 * True when X OAuth credentials are real (not the dev placeholders). The X
 * connect route uses this so users can still wire up X even if Supabase is
 * still on placeholders.
 */
export function isXConfigured(): boolean {
  return (
    env.X_CLIENT_ID !== "placeholder-x-client-id" &&
    env.X_CLIENT_SECRET !== "placeholder-x-client-secret" &&
    env.X_CLIENT_ID.length > 0 &&
    env.X_CLIENT_SECRET.length > 0
  );
}

/**
 * Helper for service modules that must refuse to operate with a placeholder.
 * Call this at the top of a request handler before touching a remote service,
 * e.g. `assertConfigured("supabase")` inside the X OAuth callback.
 */
export function assertConfigured(service: "supabase" | "anthropic" | "tavily" | "x") {
  const placeholders: Record<typeof service, () => boolean> = {
    supabase: () =>
      env.NEXT_PUBLIC_SUPABASE_URL === "http://localhost:54321" ||
      env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-role-key" ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder-anon-key" ||
      env.DATABASE_URL.includes("placeholder"),
    anthropic: () => env.ANTHROPIC_API_KEY === "placeholder-anthropic-key",
    tavily: () => env.TAVILY_API_KEY === "placeholder-tavily-key",
    x: () =>
      env.X_CLIENT_ID === "placeholder-x-client-id" ||
      env.X_CLIENT_SECRET === "placeholder-x-client-secret",
  };
  if (placeholders[service]()) {
    throw new Error(
      `Service "${service}" is not configured. Set the required keys in .env.local and restart the dev server.`,
    );
  }
}
