import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { xAccounts, toolCallLogs } from "@/db/schema";
import { env } from "@/lib/env";
import { decryptToken, encryptToken } from "@/lib/crypto";

// X API v2 base. We use the api.x.com host but twitter.com also works.
const X_API = "https://api.twitter.com";
const X_UPLOAD = "https://upload.twitter.com/1.1";
const X_AUTHORIZE = "https://twitter.com/i/oauth2/authorize";
const X_TOKEN = `${X_API}/2/oauth2/token`;

const REFRESH_LEEWAY_SECONDS = 60;

// -----------------------------
// PKCE helpers (used by /api/auth/x/connect)
// -----------------------------

export function generatePkcePair() {
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function generateOAuthState() {
  return base64url(randomBytes(24));
}

function base64url(b: Buffer): string {
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function buildAuthorizeUrl(args: {
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(X_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.X_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.X_OAUTH_REDIRECT_URI);
  url.searchParams.set("scope", env.X_OAUTH_SCOPES);
  url.searchParams.set("state", args.state);
  url.searchParams.set("code_challenge", args.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// -----------------------------
// Token endpoint (exchange + refresh)
// -----------------------------

export type TokenExchangeResult = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

function basicAuthHeader() {
  const raw = `${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

export async function exchangeAuthorizationCode(args: {
  code: string;
  codeVerifier: string;
}): Promise<TokenExchangeResult> {
  const body = new URLSearchParams({
    code: args.code,
    grant_type: "authorization_code",
    client_id: env.X_CLIENT_ID,
    redirect_uri: env.X_OAUTH_REDIRECT_URI,
    code_verifier: args.codeVerifier,
  });
  const res = await fetch(X_TOKEN, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenExchangeResult;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenExchangeResult> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.X_CLIENT_ID,
  });
  const res = await fetch(X_TOKEN, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X token refresh failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenExchangeResult;
}

// -----------------------------
// Client factory
// -----------------------------

type XAccount = typeof xAccounts.$inferSelect;

class TokenRefreshError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "TokenRefreshError";
    if (cause !== undefined) this.cause = cause;
  }
}

export type XClient = {
  account: { xUserId: string; xUsername: string };
  tweet: (input: TweetInput, ctx?: CallContext) => Promise<TweetResult>;
  getTweetMetrics: (tweetId: string, ctx?: CallContext) => Promise<TweetMetrics>;
  uploadMedia: (
    buf: Buffer,
    mimeType: string,
    ctx?: CallContext,
  ) => Promise<{ media_id_string: string }>;
};

export type CallContext = { agentStepId?: string };
export type TweetInput = {
  text: string;
  reply?: { in_reply_to_tweet_id: string };
  media?: { media_ids: string[] };
};
export type TweetResult = { id: string; text: string };
export type TweetMetrics = {
  impressions: number;
  likes: number;
  replies: number;
  reposts: number;
  bookmarks: number;
};

export async function getXClientForUser(userId: string): Promise<XClient> {
  const found = await db.select().from(xAccounts).where(eq(xAccounts.userId, userId)).limit(1);
  const account = found[0];
  if (!account) {
    throw new Error(`No X account connected for user ${userId}`);
  }
  if (account.invalid) {
    throw new Error("X account requires reconnection — refresh previously failed");
  }
  return buildClient(account);
}

async function buildClient(initial: XAccount): Promise<XClient> {
  let current = initial;

  async function getAccessToken(): Promise<string> {
    const expiresInMs = current.expiresAt.getTime() - Date.now();
    if (expiresInMs > REFRESH_LEEWAY_SECONDS * 1000) {
      return decryptToken(current.accessTokenEncrypted);
    }
    // Refresh required.
    let refreshed: TokenExchangeResult;
    try {
      refreshed = await refreshAccessToken(decryptToken(current.refreshTokenEncrypted));
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await db
        .update(xAccounts)
        .set({ invalid: true, lastRefreshError: reason, updatedAt: new Date() })
        .where(eq(xAccounts.id, current.id));
      throw new TokenRefreshError(
        "Refresh token rejected by X — user must reconnect.",
        err,
      );
    }
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    const updated = await db
      .update(xAccounts)
      .set({
        accessTokenEncrypted: encryptToken(refreshed.access_token),
        refreshTokenEncrypted: encryptToken(refreshed.refresh_token),
        expiresAt: newExpiresAt,
        scopes: refreshed.scope.split(/\s+/).filter(Boolean),
        invalid: false,
        lastRefreshError: null,
        updatedAt: new Date(),
      })
      .where(eq(xAccounts.id, current.id))
      .returning();
    const row = updated[0];
    if (!row) throw new Error("Failed to persist refreshed X tokens");
    current = row;
    return refreshed.access_token;
  }

  async function call<T>(args: {
    name: string;
    url: string;
    init: (token: string) => RequestInit;
    parse: (res: Response) => Promise<T>;
    ctx?: CallContext;
    inputForLog?: Record<string, unknown>;
  }): Promise<T> {
    const started = Date.now();
    let lastErr: unknown;
    let parsed: T | null = null;
    let errorMessage: string | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const token = await getAccessToken();
        const res = await fetch(args.url, args.init(token));
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          const reset = res.headers.get("x-rate-limit-reset");
          const waitMs = reset
            ? Math.max(0, Number(reset) * 1000 - Date.now())
            : 500 * Math.pow(2, attempt);
          if (attempt < 3) {
            await delay(Math.min(waitMs, 15_000));
            continue;
          }
          const text = await res.text();
          throw new Error(`X API ${res.status} after retries: ${text}`);
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`X API ${res.status}: ${text}`);
        }
        parsed = await args.parse(res);
        break;
      } catch (err) {
        lastErr = err;
        if (err instanceof TokenRefreshError) {
          errorMessage = err.message;
          break;
        }
        if (attempt === 3) {
          errorMessage = err instanceof Error ? err.message : String(err);
          break;
        }
        await delay(500 * Math.pow(2, attempt));
      }
    }
    const duration = Date.now() - started;
    if (args.ctx?.agentStepId) {
      await db
        .insert(toolCallLogs)
        .values({
          agentStepId: args.ctx.agentStepId,
          toolName: `x.${args.name}`,
          inputJson: args.inputForLog ?? null,
          outputJson: parsed ? (parsed as unknown as Record<string, unknown>) : null,
          durationMs: duration,
          error: errorMessage,
        })
        .catch(() => {
          // Logging failures must not break the call path.
        });
    }
    if (parsed) return parsed;
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  return {
    account: { xUserId: current.xUserId, xUsername: current.xUsername },

    tweet: (input, ctx) =>
      call({
        name: "tweet",
        url: `${X_API}/2/tweets`,
        ctx,
        inputForLog: { text: input.text, hasMedia: Boolean(input.media) },
        init: (token) => ({
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        }),
        parse: async (res) => {
          const json = (await res.json()) as { data: TweetResult };
          return json.data;
        },
      }),

    getTweetMetrics: (tweetId, ctx) =>
      call({
        name: "getTweetMetrics",
        url:
          `${X_API}/2/tweets/${encodeURIComponent(tweetId)}` +
          `?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        ctx,
        inputForLog: { tweetId },
        init: (token) => ({
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }),
        parse: async (res) => {
          const json = (await res.json()) as {
            data: {
              public_metrics?: {
                impression_count?: number;
                like_count?: number;
                reply_count?: number;
                retweet_count?: number;
                bookmark_count?: number;
              };
              non_public_metrics?: { impression_count?: number };
              organic_metrics?: { impression_count?: number };
            };
          };
          const pm = json.data.public_metrics ?? {};
          const impressions =
            json.data.organic_metrics?.impression_count ??
            json.data.non_public_metrics?.impression_count ??
            pm.impression_count ??
            0;
          return {
            impressions,
            likes: pm.like_count ?? 0,
            replies: pm.reply_count ?? 0,
            reposts: pm.retweet_count ?? 0,
            bookmarks: pm.bookmark_count ?? 0,
          };
        },
      }),

    uploadMedia: (buf, mimeType, ctx) =>
      call({
        name: "uploadMedia",
        url: `${X_UPLOAD}/media/upload.json`,
        ctx,
        inputForLog: { bytes: buf.length, mimeType },
        init: (token) => {
          const form = new FormData();
          form.append(
            "media",
            new Blob([new Uint8Array(buf)], { type: mimeType }),
            "media",
          );
          return {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          };
        },
        parse: async (res) => {
          const json = (await res.json()) as { media_id_string: string };
          return json;
        },
      }),
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------
// Fetch the X user identity (used by /api/auth/x/callback)
// -----------------------------

export async function fetchXUserMe(
  accessToken: string,
): Promise<{ id: string; username: string }> {
  const res = await fetch(`${X_API}/2/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X users/me failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { data: { id: string; username: string } };
  return json.data;
}
