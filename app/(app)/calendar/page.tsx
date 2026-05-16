import { and, asc, eq, gte, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { generatedPosts } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { CalendarBoard } from "./calendar-board";

type GeneratedPost = typeof generatedPosts.$inferSelect;
type CalendarRow = Pick<
  GeneratedPost,
  "id" | "text" | "status" | "scheduledFor" | "format"
>;

function weekStart(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  const dow = (out.getUTCDay() + 6) % 7;
  out.setUTCDate(out.getUTCDate() - dow);
  return out;
}

type Search = Promise<{ start?: string }>;

export default async function CalendarPage({ searchParams }: { searchParams: Search }) {
  const { appUser } = await requireAppUser();
  const { start } = await searchParams;

  const anchor = start ? new Date(start) : new Date();
  const startUtc = weekStart(anchor);
  const endUtc = new Date(startUtc);
  endUtc.setUTCDate(endUtc.getUTCDate() + 7);

  const dbPosts: CalendarRow[] = await tryDbQuery<CalendarRow[]>(
    () =>
      db
        .select({
          id: generatedPosts.id,
          text: generatedPosts.text,
          status: generatedPosts.status,
          scheduledFor: generatedPosts.scheduledFor,
          format: generatedPosts.format,
        })
        .from(generatedPosts)
        .where(
          and(
            eq(generatedPosts.userId, appUser.id),
            isNotNull(generatedPosts.scheduledFor),
            gte(generatedPosts.scheduledFor, startUtc),
            lt(generatedPosts.scheduledFor, endUtc),
          ),
        )
        .orderBy(asc(generatedPosts.scheduledFor)),
    [],
  );

  const posts = dbPosts.map((p) => ({
    id: p.id,
    text: p.text,
    status: p.status,
    format: p.format,
    scheduledFor: p.scheduledFor?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-600">
          Calendar
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          The week ahead.
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Week of{" "}
          {startUtc.toLocaleDateString(undefined, { dateStyle: "long" })}. Click any
          post to reschedule.
        </p>
      </header>
      <CalendarBoard startIso={startUtc.toISOString()} posts={posts} />
    </div>
  );
}
