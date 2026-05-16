import "server-only";
import pino from "pino";
import { db } from "@/db/client";
import { traceEvents, type traceLevelEnum } from "@/db/schema";
import { env } from "@/lib/env";

export type TraceLevel = (typeof traceLevelEnum.enumValues)[number];

const pinoLogger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  ...(env.NODE_ENV === "production"
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l", singleLine: true },
        },
      }),
});

export type TraceClient = {
  trace: (
    level: TraceLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  debug: (msg: string, meta?: Record<string, unknown>) => Promise<void>;
  info: (msg: string, meta?: Record<string, unknown>) => Promise<void>;
  warn: (msg: string, meta?: Record<string, unknown>) => Promise<void>;
  error: (msg: string, meta?: Record<string, unknown>) => Promise<void>;
};

export function createTraceClient(args: {
  growthRunId: string;
  agentStepId?: string | null;
}): TraceClient {
  const trace: TraceClient["trace"] = async (level, message, metadata) => {
    pinoLogger[level === "debug" ? "debug" : level === "warn" ? "warn" : level === "error" ? "error" : "info"](
      { growthRunId: args.growthRunId, agentStepId: args.agentStepId ?? undefined, ...metadata },
      message,
    );
    try {
      await db.insert(traceEvents).values({
        growthRunId: args.growthRunId,
        agentStepId: args.agentStepId ?? null,
        level,
        message,
        metadata: metadata ?? null,
      });
    } catch (err) {
      // Trace persistence must never break the agent path.
      pinoLogger.error({ err }, "trace_events insert failed");
    }
  };
  return {
    trace,
    debug: (msg, meta) => trace("debug", msg, meta),
    info: (msg, meta) => trace("info", msg, meta),
    warn: (msg, meta) => trace("warn", msg, meta),
    error: (msg, meta) => trace("error", msg, meta),
  };
}
