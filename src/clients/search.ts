import "server-only";
import { tavily } from "@tavily/core";
import { db } from "@/db/client";
import { toolCallLogs } from "@/db/schema";
import { env } from "@/lib/env";

let cached: ReturnType<typeof tavily> | null = null;
function client() {
  cached ??= tavily({ apiKey: env.TAVILY_API_KEY });
  return cached;
}

export type SearchResult = {
  url: string;
  title: string | null;
  snippet: string | null;
  score: number | null;
};

export type SearchContext = {
  agentStepId?: string | null;
};

export async function search(args: {
  query: string;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  topic?: "general" | "news";
  ctx?: SearchContext;
}): Promise<SearchResult[]> {
  const started = Date.now();
  try {
    const res = await client().search(args.query, {
      maxResults: args.maxResults ?? 5,
      includeDomains: args.includeDomains,
      excludeDomains: args.excludeDomains,
      topic: args.topic,
      searchDepth: "advanced",
    });
    const results: SearchResult[] = (res.results ?? []).map((r) => ({
      url: r.url,
      title: r.title ?? null,
      snippet: r.content ?? null,
      score: typeof r.score === "number" ? r.score : null,
    }));
    await logCall({
      ctx: args.ctx,
      started,
      input: { query: args.query, maxResults: args.maxResults },
      output: { count: results.length },
    });
    return results;
  } catch (err) {
    await logCall({
      ctx: args.ctx,
      started,
      input: { query: args.query, maxResults: args.maxResults },
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

async function logCall(args: {
  ctx?: SearchContext;
  started: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}) {
  if (!args.ctx?.agentStepId) return;
  await db
    .insert(toolCallLogs)
    .values({
      agentStepId: args.ctx.agentStepId,
      toolName: "tavily.search",
      inputJson: args.input,
      outputJson: args.output ?? null,
      durationMs: Date.now() - args.started,
      error: args.error ?? null,
    })
    .catch(() => {
      // ignore
    });
}
