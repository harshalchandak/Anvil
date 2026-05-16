import type { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { brandProfiles, growthRuns } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { inngest } from "@/inngest/client";
import { isPlaceholderEnv } from "@/lib/env";

const CreateBodySchema = z.object({
  brandProfileId: z.string().uuid(),
  triggerType: z.enum(["manual", "webhook", "scheduled"]).default("manual"),
});

export async function GET() {
  const { appUser } = await requireAppUser();
  try {
    const rows = await db
      .select()
      .from(growthRuns)
      .where(eq(growthRuns.userId, appUser.id))
      .orderBy(desc(growthRuns.createdAt))
      .limit(50);
    return apiOk({ runs: rows });
  } catch (err) {
    console.error("[GET /api/growth-runs] db read failed:", err);
    return apiError(classifyDbError(err), 503);
  }
}

export async function POST(request: NextRequest) {
  const { appUser } = await requireAppUser();

  const parsed = await parseJson(request, CreateBodySchema);
  if (!parsed.ok) return parsed.response;

  // Fail fast and clear when Supabase isn't configured. Without it we can't
  // insert into growth_runs, fire Inngest, or run any agents.
  if (isPlaceholderEnv()) {
    return apiError(
      "Supabase is not configured. Fill DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY in .env.local, run `pnpm exec drizzle-kit push`, then restart `pnpm dev`.",
      412,
    );
  }

  try {
    // Confirm the brand belongs to this user.
    const brand = (
      await db
        .select()
        .from(brandProfiles)
        .where(
          and(
            eq(brandProfiles.id, parsed.data.brandProfileId),
            eq(brandProfiles.userId, appUser.id),
          ),
        )
        .limit(1)
    )[0];
    if (!brand) {
      return apiError(
        "Brand profile not found in the database. If you saved it in demo mode (cookie storage), set up Supabase and re-save it from /brand.",
        404,
      );
    }

    const inserted = await db
      .insert(growthRuns)
      .values({
        userId: appUser.id,
        brandProfileId: brand.id,
        triggerType: parsed.data.triggerType,
        niche: brand.niche,
        goal: brand.goal,
        status: "pending",
      })
      .returning({ id: growthRuns.id });
    const row = inserted[0];
    if (!row) {
      return apiError(
        "Insert returned no row — most likely RLS denied the write. Confirm the server is using the service-role key (SUPABASE_SERVICE_ROLE_KEY).",
        500,
      );
    }

    try {
      await inngest.send({
        name: "growth-run/start",
        data: { growthRunId: row.id },
      });
    } catch (err) {
      // The run row is committed; Inngest is the orchestrator and a separate
      // failure mode. Surface it but don't roll back the run.
      console.error("[POST /api/growth-runs] inngest.send failed:", err);
      return apiOk(
        {
          runId: row.id,
          warning:
            "Run created, but Inngest didn't accept the event. The dev CLI may not be running (try `npx inngest-cli@latest dev`).",
        },
        201,
      );
    }

    return apiOk({ runId: row.id }, 201);
  } catch (err) {
    // Log the real cause to the server console so the operator can see it,
    // then surface a classified, actionable message to the UI.
    console.error("[POST /api/growth-runs] failed:", err);
    return apiError(classifyDbError(err), 503);
  }
}

/**
 * Turn opaque Drizzle / pg errors into actionable user-facing messages. Keep
 * the original in the console.error above for ops, but show something the
 * person clicking the button can act on.
 */
function classifyDbError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  // postgres-js / pg connection errors
  if (
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("connection terminated") ||
    lower.includes("getaddrinfo")
  ) {
    return "Database not reachable. Confirm DATABASE_URL is correct and the Supabase project isn't paused (free-tier projects pause after inactivity — resume it in the Supabase dashboard).";
  }

  // Schema not pushed
  if (
    lower.includes("relation") && lower.includes("does not exist")
  ) {
    return "Tables missing — run `pnpm exec drizzle-kit push` to apply the schema, then retry.";
  }

  // RLS / auth
  if (
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("rls")
  ) {
    return "Row-level security blocked the insert. The server must use SUPABASE_SERVICE_ROLE_KEY (not the anon key) for run creation.";
  }

  // Auth / api key invalid
  if (
    lower.includes("invalid api key") ||
    lower.includes("invalid jwt") ||
    lower.includes("password authentication failed")
  ) {
    return "Supabase credentials invalid. Re-copy NEXT_PUBLIC_SUPABASE_URL / *_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL from the Supabase dashboard.";
  }

  return `Run failed: ${message}`;
}
