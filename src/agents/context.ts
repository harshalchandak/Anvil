import "server-only";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db/client";
import { agentSteps } from "@/db/schema";
import { createTraceClient, type TraceClient } from "@/clients/trace";

export type AgentContext = {
  growthRunId: string;
  userId: string;
  parentStepId: string | null;
  traceClient: TraceClient;
};

/**
 * Spawn a child context that traces under a new agent step id.
 */
export function withStep(parent: AgentContext, stepId: string): AgentContext {
  return {
    ...parent,
    parentStepId: stepId,
    traceClient: createTraceClient({
      growthRunId: parent.growthRunId,
      agentStepId: stepId,
    }),
  };
}

/**
 * Wrap an agent invocation in an `agent_steps` row with status transitions
 * (running -> completed | failed). Validates input + output with Zod and
 * captures duration. Throws on failure after marking the step failed.
 */
export async function runAgentStep<I, O>(args: {
  ctx: AgentContext;
  agentName: string;
  stepName: string;
  input: I;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  handler: (input: I, stepCtx: AgentContext) => Promise<O>;
}): Promise<{ output: O; stepId: string }> {
  const parsedInput = args.inputSchema.safeParse(args.input);
  if (!parsedInput.success) {
    throw new Error(
      `Invalid input to ${args.agentName}: ${parsedInput.error.message}`,
    );
  }

  const [row] = await db
    .insert(agentSteps)
    .values({
      growthRunId: args.ctx.growthRunId,
      parentStepId: args.ctx.parentStepId,
      agentName: args.agentName,
      stepName: args.stepName,
      status: "running",
      inputJson: parsedInput.data as unknown as Record<string, unknown>,
      startedAt: new Date(),
    })
    .returning({ id: agentSteps.id });
  if (!row) {
    throw new Error(`Failed to create agent_steps row for ${args.agentName}`);
  }
  const stepId = row.id;

  const stepCtx = withStep(args.ctx, stepId);
  const startMs = Date.now();

  try {
    const rawOutput = await args.handler(parsedInput.data, stepCtx);
    const parsedOutput = args.outputSchema.safeParse(rawOutput);
    if (!parsedOutput.success) {
      throw new Error(
        `Agent ${args.agentName} produced output that failed schema validation: ${parsedOutput.error.message}`,
      );
    }
    const now = new Date();
    await db
      .update(agentSteps)
      .set({
        status: "completed",
        outputJson: parsedOutput.data as unknown as Record<string, unknown>,
        completedAt: now,
        durationMs: Date.now() - startMs,
        updatedAt: now,
      })
      .where(eq(agentSteps.id, stepId));
    return { output: parsedOutput.data, stepId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const now = new Date();
    await db
      .update(agentSteps)
      .set({
        status: "failed",
        error: message,
        completedAt: now,
        durationMs: Date.now() - startMs,
        updatedAt: now,
      })
      .where(eq(agentSteps.id, stepId));
    await stepCtx.traceClient.error(`agent failed: ${args.agentName}`, {
      stepName: args.stepName,
      error: message,
    });
    throw err;
  }
}
