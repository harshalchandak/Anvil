import "server-only";
import { generateObject, generateText, type LanguageModel } from "ai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import type { z } from "zod";
import { db } from "@/db/client";
import { toolCallLogs } from "@/db/schema";
import { env } from "@/lib/env";

// =========================================================================
// Provider routing
//
// The Vercel AI SDK lets us swap providers without changing call-sites. We
// pick one based on the model id:
//   - "grok-*"            → xAI  (requires XAI_API_KEY)
//   - everything else     → Anthropic (requires ANTHROPIC_API_KEY)
//
// Set `LLM_MODEL` in .env.local to choose the default (e.g. "grok-4",
// "grok-3-mini", "claude-sonnet-4-5"). Individual agents can override via
// the `modelId` arg.
// =========================================================================

let cachedXai: ReturnType<typeof createXai> | null = null;
function xaiProvider() {
  if (cachedXai) return cachedXai;
  if (!env.XAI_API_KEY) {
    throw new Error(
      "XAI_API_KEY is not set. Add it to .env.local to use grok-* models, or switch LLM_MODEL back to a claude-* model.",
    );
  }
  cachedXai = createXai({ apiKey: env.XAI_API_KEY });
  return cachedXai;
}

let cachedAnthropic: ReturnType<typeof createAnthropic> | null = null;
function anthropicProvider() {
  if (cachedAnthropic) return cachedAnthropic;
  // createAnthropic reads from process.env.ANTHROPIC_API_KEY by default —
  // pass it explicitly so we control where it comes from.
  cachedAnthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedAnthropic;
}

function resolveModel(modelId: string): LanguageModel {
  if (/^grok-/i.test(modelId)) {
    return xaiProvider()(modelId);
  }
  // Default everything else through Anthropic. The `anthropic` import is
  // retained as the canonical Claude provider — `anthropicProvider()` is just
  // a thin alias so we can pin the API key explicitly.
  void anthropic;
  return anthropicProvider()(modelId);
}

function defaultModel(): LanguageModel {
  return resolveModel(env.LLM_MODEL);
}

export type LlmCallContext = {
  agentStepId?: string | null;
};

/**
 * Generate a typed value validated against a Zod schema. Retries once on
 * schema-mismatch / parse failure with a repair prompt that includes the
 * validation error so the model can self-correct.
 */
export async function generateStructured<T>(args: {
  schema: z.ZodType<T>;
  system?: string;
  prompt: string;
  modelId?: string;
  ctx?: LlmCallContext;
  toolName?: string;
}): Promise<T> {
  const model = args.modelId ? resolveModel(args.modelId) : defaultModel();
  const started = Date.now();

  const attempt = async (extraSystem?: string) =>
    generateObject({
      model,
      schema: args.schema as z.ZodType<T>,
      system: [args.system, extraSystem].filter(Boolean).join("\n\n") || undefined,
      prompt: args.prompt,
    });

  let result;
  let lastError: unknown;
  try {
    result = await attempt();
  } catch (err) {
    lastError = err;
    const validationHint =
      err instanceof Error
        ? `Your previous response did not match the required JSON schema. Error:\n${err.message}\n\nRespond with valid JSON that strictly matches the schema.`
        : "Your previous response did not match the schema. Try again.";
    try {
      result = await attempt(validationHint);
    } catch (err2) {
      await logCall({
        ctx: args.ctx,
        toolName: args.toolName ?? "llm.generateStructured",
        started,
        input: { prompt: args.prompt },
        error: err2 instanceof Error ? err2.message : String(err2),
      });
      throw err2;
    }
  }

  await logCall({
    ctx: args.ctx,
    toolName: args.toolName ?? "llm.generateStructured",
    started,
    input: { prompt: args.prompt },
    output: { usage: result.usage as unknown as Record<string, unknown> },
    error: lastError ? "recovered_after_one_retry" : null,
  });

  return result.object;
}

export async function generatePlainText(args: {
  system?: string;
  prompt: string;
  modelId?: string;
  ctx?: LlmCallContext;
  toolName?: string;
}): Promise<string> {
  const model = args.modelId ? resolveModel(args.modelId) : defaultModel();
  const started = Date.now();
  try {
    const result = await generateText({
      model,
      system: args.system,
      prompt: args.prompt,
    });
    await logCall({
      ctx: args.ctx,
      toolName: args.toolName ?? "llm.generateText",
      started,
      input: { prompt: args.prompt },
      output: { usage: result.usage as unknown as Record<string, unknown> },
    });
    return result.text;
  } catch (err) {
    await logCall({
      ctx: args.ctx,
      toolName: args.toolName ?? "llm.generateText",
      started,
      input: { prompt: args.prompt },
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

async function logCall(args: {
  ctx?: LlmCallContext;
  toolName: string;
  started: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string | null;
}) {
  if (!args.ctx?.agentStepId) return;
  await db
    .insert(toolCallLogs)
    .values({
      agentStepId: args.ctx.agentStepId,
      toolName: args.toolName,
      inputJson: args.input,
      outputJson: args.output ?? null,
      durationMs: Date.now() - args.started,
      error: args.error ?? null,
    })
    .catch(() => {
      // tool_call_logs failures must not break the agent path.
    });
}
