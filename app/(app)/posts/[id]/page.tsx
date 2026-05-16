import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db/client";
import { generatedPosts } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { PostEditor } from "./post-editor";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { appUser } = await requireAppUser();
  const { id } = await params;

  const dbPost = await tryDbQuery(
    async () =>
      (
        await db
          .select()
          .from(generatedPosts)
          .where(and(eq(generatedPosts.id, id), eq(generatedPosts.userId, appUser.id)))
          .limit(1)
      )[0] ?? null,
    null,
  );

  if (!dbPost) notFound();

  const post = {
    id: dbPost.id,
    text: dbPost.text,
    status: dbPost.status,
    format: dbPost.format,
    xPostId: dbPost.xPostId,
    riskNotes: dbPost.riskNotes,
    scores: (dbPost.scoresJson as Record<string, number> | null) ?? null,
    reasoning: dbPost.reasoning,
    scheduledFor: dbPost.scheduledFor?.toISOString() ?? null,
  };

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 transition hover:text-neutral-800"
        >
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Post editor
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Edit, rewrite, or ship. Your AI team scored every dimension on the right.
        </p>
      </header>

      <PostEditor post={post} />
    </div>
  );
}
