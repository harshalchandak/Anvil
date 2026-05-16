import { cn } from "@/lib/cn";

/** Decorative soft gradient blobs for hero / section backgrounds. */
export function GradientBlobs({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div className="blob absolute -left-32 top-12 h-[360px] w-[360px] rounded-full bg-violet-300/40 blur-3xl" />
      <div
        className="blob absolute right-[-20%] top-32 h-[400px] w-[400px] rounded-full bg-orange-200/50 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="blob absolute left-[20%] bottom-[-10%] h-[420px] w-[420px] rounded-full bg-amber-200/40 blur-3xl"
        style={{ animationDelay: "6s" }}
      />
    </div>
  );
}
