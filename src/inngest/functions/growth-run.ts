import "server-only";
import { inngest } from "@/inngest/client";
import { runGrowthPipeline } from "@/agents/orchestrator";

/**
 * Top-level Inngest function for a growth run.
 *
 * The pipeline itself uses our own runAgentStep helper for fine-grained
 * agent_steps observability; we keep one durable Inngest checkpoint so a
 * worker crash mid-run resumes the whole pipeline. Splitting into per-agent
 * step.run blocks is a Phase 11+ refinement (would require serializing
 * inter-agent state).
 */
export const growthRunFn = inngest.createFunction(
  {
    id: "growth-run",
    retries: 0,
    triggers: [{ event: "growth-run/start" }],
  },
  async ({ event, step }) => {
    const data = event.data as { growthRunId: string };
    return step.run("growth-pipeline", () => runGrowthPipeline(data.growthRunId));
  },
);
