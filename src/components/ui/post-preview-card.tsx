"use client";

import { Heart, MessageCircle, Repeat2, Bookmark, Share } from "lucide-react";

/**
 * X-style tweet card preview. Used in the post editor and the run output panel.
 */
export function PostPreviewCard({
  text,
  displayName,
  handle,
  avatarHue = 260,
  carouselImages,
}: {
  text: string;
  displayName: string;
  handle: string;
  avatarHue?: number;
  carouselImages?: string[];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white shadow-card">
      <div className="flex items-start gap-3 px-5 pt-5">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold"
          style={{
            background: `linear-gradient(135deg, hsl(${avatarHue} 80% 60%), hsl(${(avatarHue + 60) % 360} 80% 55%))`,
          }}
        >
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate font-semibold text-neutral-900">
              {displayName}
            </span>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-sky-500"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M22.46 5.94c-.76.34-1.58.57-2.44.67a4.27 4.27 0 0 0 1.87-2.36 8.5 8.5 0 0 1-2.7 1.03 4.24 4.24 0 0 0-7.22 3.87 12 12 0 0 1-8.72-4.42 4.24 4.24 0 0 0 1.31 5.66 4.2 4.2 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.15c-.45.12-.92.18-1.4.18-.34 0-.67-.03-1-.09a4.24 4.24 0 0 0 3.95 2.94 8.5 8.5 0 0 1-5.26 1.81c-.34 0-.67-.02-1-.06A12 12 0 0 0 8.29 20c7.55 0 11.68-6.25 11.68-11.68v-.53a8.3 8.3 0 0 0 2.05-2.12z"
              />
            </svg>
            <span className="truncate text-neutral-500">@{handle}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">now</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-900">
            {text}
          </p>

          {carouselImages && carouselImages.length > 0 && (
            <div
              className={
                carouselImages.length === 1
                  ? "mt-3"
                  : "mt-3 grid grid-cols-2 gap-1"
              }
            >
              {carouselImages.slice(0, 4).map((src, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-neutral-100"
                  style={{ backgroundImage: `url(${src})`, backgroundSize: "cover" }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3 text-neutral-500">
        <Action icon={<MessageCircle size={16} />} value="—" />
        <Action icon={<Repeat2 size={16} />} value="—" />
        <Action icon={<Heart size={16} />} value="—" />
        <Action icon={<Bookmark size={16} />} value="—" />
        <Action icon={<Share size={16} />} value="" />
      </div>
    </article>
  );
}

function Action({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      {icon}
      {value && <span>{value}</span>}
    </span>
  );
}
