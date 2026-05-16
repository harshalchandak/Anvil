import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db/client";
import { carousels, carouselSlides } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { CarouselEditor } from "./carousel-editor";

type Template =
  | "minimal-dark"
  | "premium-light"
  | "founder-notes"
  | "neon-tech"
  | "soft-pastel";

type SP = Promise<{ template?: string }>;

export default async function CarouselPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const { appUser } = await requireAppUser();
  const { id } = await params;
  const { template: templateQuery } = await searchParams;

  const carousel = await tryDbQuery(
    async () =>
      (
        await db
          .select()
          .from(carousels)
          .where(and(eq(carousels.id, id), eq(carousels.userId, appUser.id)))
          .limit(1)
      )[0] ?? null,
    null,
  );

  if (!carousel) notFound();

  const slidesRows = await tryDbQuery(
    () =>
      db
        .select()
        .from(carouselSlides)
        .where(eq(carouselSlides.carouselId, id))
        .orderBy(asc(carouselSlides.slideNumber)),
    [],
  );

  const data = {
    id: carousel.id,
    template:
      ((templateQuery as Template | undefined) ??
        (carousel.template as Template)) ?? "premium-light",
    caption: carousel.caption ?? "",
    slides: slidesRows.map((s) => ({
      n: s.slideNumber,
      title: s.title,
      body: s.body,
    })),
    growthRunId: carousel.growthRunId,
  };

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/runs/${data.growthRunId}`}
          className="inline-flex items-center gap-1 text-xs text-neutral-500 transition hover:text-neutral-800"
        >
          <ArrowLeft size={12} /> Back to run
        </Link>
        <h1 className="mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          Carousel editor
        </h1>
        <p className="mt-1.5 text-sm text-neutral-600">
          Swap templates, edit copy, export the whole deck as PNG.
        </p>
      </header>

      <CarouselEditor
        carouselId={data.id}
        caption={data.caption}
        initialTemplate={data.template}
        slides={data.slides}
      />
    </div>
  );
}
