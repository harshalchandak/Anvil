"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  X as XIcon,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { cn } from "@/lib/cn";

type Tone = "direct" | "playful" | "thoughtful" | "spicy";
type Goal = "trial" | "audience" | "newsletter" | "consult";

const NICHE_CHIPS = [
  "Indie SaaS founders",
  "Solo devs",
  "Product designers",
  "Marketing operators",
  "DTC ecommerce",
  "AI engineers",
  "Content creators",
  "B2B SaaS marketers",
  "Web3 / crypto",
  "Personal finance",
  "Fitness & wellness",
  "Career & coaching",
];

const AUDIENCE_CHIPS = [
  "Building MRR 0 → 10k",
  "Designers shipping products",
  "Newsletter ops",
  "Heads of growth at Series A",
  "Bootstrapped founders",
  "Engineering leaders",
  "Solo creators monetizing",
  "Agency owners",
];

const GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: "trial", label: "Drive product trials", hint: "Free → paid signups" },
  { id: "audience", label: "Grow followers", hint: "1k → 10k → 100k" },
  { id: "newsletter", label: "Newsletter subscribers", hint: "Owned audience" },
  { id: "consult", label: "Inbound consulting", hint: "Authority + DMs" },
];

const TONES: { id: Tone; label: string; hint: string }[] = [
  { id: "direct", label: "Direct", hint: "No fluff. Opinion-first." },
  { id: "playful", label: "Playful", hint: "Dry humor, light touch." },
  { id: "thoughtful", label: "Thoughtful", hint: "Long sentences, nuance." },
  { id: "spicy", label: "Spicy", hint: "Strong takes welcome." },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [accountDraft, setAccountDraft] = useState("");

  const steps = [
    {
      title: "Tell us what you talk about",
      sub: "Niche + audience. Two sentences is plenty.",
    },
    {
      title: "What are we optimizing for?",
      sub: "Pick a goal and a tone. You can change these later.",
    },
    {
      title: "Who do you read?",
      sub: "Add 3–5 accounts whose voice you admire. We'll learn what works in your space.",
    },
    {
      title: "Plug into X",
      sub: "Optional. Connect now or skip — we'll export content as text & PNG either way.",
    },
  ];

  const canAdvance =
    (step === 0 && niche.trim().length > 0 && audience.trim().length > 0) ||
    (step === 1 && goal && tone) ||
    step === 2 ||
    step === 3;

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else router.push("/dashboard");
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }
  function pushAccount() {
    const v = accountDraft.trim().replace(/^@/, "");
    if (!v) return;
    setAccounts((acc) => Array.from(new Set([...acc, v])));
    setAccountDraft("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium uppercase tracking-[0.15em] text-violet-600">
            Step {step + 1} of {steps.length}
          </span>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-neutral-500 hover:text-neutral-800"
          >
            Skip for now
          </button>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            initial={false}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-500"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="rounded-3xl border border-[var(--border-subtle)] bg-white p-8 shadow-[0_4px_18px_rgba(0,0,0,0.04)] md:p-10"
        >
          <header className="space-y-1.5">
            <h1 className="text-2xl font-medium tracking-tight md:text-3xl">
              {steps[step]!.title}
            </h1>
            <p className="text-sm text-neutral-600">{steps[step]!.sub}</p>
          </header>

          <div className="mt-8 space-y-6">
            {step === 0 && (
              <>
                <Field label="Niche" placeholder="AI productivity for indie founders">
                  <input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="AI productivity for indie founders"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-base outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <Chips
                    options={NICHE_CHIPS}
                    onPick={(v) => setNiche(v)}
                  />
                </Field>
                <Field
                  label="Audience"
                  placeholder="Solo devs shipping micro-SaaS, MRR 0 → 10k"
                >
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Solo devs shipping micro-SaaS, MRR 0 → 10k"
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-base outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  />
                  <Chips
                    options={AUDIENCE_CHIPS}
                    onPick={(v) => setAudience(v)}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Goal">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGoal(g.id)}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition",
                          goal === g.id
                            ? "border-violet-500 bg-violet-50/50 ring-2 ring-violet-100"
                            : "border-[var(--border-subtle)] bg-white hover:border-neutral-400",
                        )}
                      >
                        <span className="text-sm font-medium">{g.label}</span>
                        <span className="text-xs text-neutral-500">{g.hint}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Tone">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border px-3 py-3 text-left transition",
                          tone === t.id
                            ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-100"
                            : "border-[var(--border-subtle)] bg-white hover:border-neutral-400",
                        )}
                      >
                        <span className="text-sm font-medium">{t.label}</span>
                        <span className="text-xs text-neutral-500">{t.hint}</span>
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 2 && (
              <Field label="Accounts you admire">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                  {accounts.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700"
                    >
                      @{a}
                      <button
                        type="button"
                        onClick={() =>
                          setAccounts((cur) => cur.filter((x) => x !== a))
                        }
                        className="text-violet-500 hover:text-violet-800"
                      >
                        <XIcon size={11} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={accountDraft}
                    onChange={(e) => setAccountDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        pushAccount();
                      }
                    }}
                    onBlur={pushAccount}
                    placeholder={
                      accounts.length === 0 ? "@levelsio, @dvassallo…" : "Add another"
                    }
                    className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Press Enter or comma to add. We never copy their words —
                  just learn shape.
                </p>
              </Field>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-violet-50 via-orange-50 to-amber-50 p-6">
                  <h3 className="text-base font-medium tracking-tight">
                    Connect your X account
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    Required for publishing and analytics. Tokens are
                    encrypted at rest; you can disconnect any time.
                  </p>
                  <a
                    href="/api/auth/x/connect"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
                      <path d="M14.7 10.4 22.2 1.5h-1.8l-6.6 7.7L8.6 1.5H1l7.9 11.4L1 22.4h1.8l6.9-8 5.5 8H23l-8.3-12zM10.6 12.4l-.8-1.1L3.5 2.9h3l5.2 7.4.8 1.1 6.7 9.6h-3l-5.6-7.6z"/>
                    </svg>
                    Connect X
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-neutral-500 hover:text-neutral-800"
                >
                  Skip for now — I&apos;ll just export content
                </button>
              </div>
            )}
          </div>

          <footer className="mt-10 flex items-center justify-between">
            <GradientButton
              type="button"
              onClick={back}
              variant="ghost"
              disabled={step === 0}
            >
              <ArrowLeft size={14} /> Back
            </GradientButton>
            <GradientButton
              type="button"
              onClick={next}
              disabled={!canAdvance}
              variant="gradient"
            >
              {step === steps.length - 1 ? (
                <>
                  <Check size={14} /> Open dashboard
                </>
              ) : (
                <>
                  Continue <ArrowRight size={14} />
                </>
              )}
            </GradientButton>
          </footer>
        </motion.section>
      </AnimatePresence>

      <p className="text-center text-xs text-neutral-500">
        <Sparkles size={11} className="inline -translate-y-px" /> Nothing
        you enter is published. Edit any of this from Brand later.
      </p>
    </div>
  );
}

function Field({
  label,
  placeholder,
  children,
}: {
  label: string;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </span>
      <div className="space-y-2">{children}</div>
      {placeholder && (
        <span className="sr-only">{placeholder}</span>
      )}
    </label>
  );
}

function Chips({
  options,
  onPick,
}: {
  options: string[];
  onPick: (v: string) => void;
}) {
  const [showOther, setShowOther] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(o)}
            className="rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1 text-xs text-neutral-600 transition hover:border-violet-300 hover:text-violet-700"
          >
            {o}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowOther((v) => !v)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition",
            showOther
              ? "border-violet-400 bg-violet-50 text-violet-700"
              : "border-dashed border-[var(--border-subtle)] bg-white text-neutral-500 hover:border-violet-300 hover:text-violet-700",
          )}
        >
          + Other
        </button>
      </div>
      {showOther && (
        <div className="flex gap-2">
          <input
            value={otherDraft}
            onChange={(e) => setOtherDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (otherDraft.trim()) {
                  onPick(otherDraft.trim());
                  setOtherDraft("");
                  setShowOther(false);
                }
              }
            }}
            placeholder="Type your own…"
            className="flex-1 rounded-full border border-[var(--border-subtle)] bg-white px-3 py-1 text-xs outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (otherDraft.trim()) {
                onPick(otherDraft.trim());
                setOtherDraft("");
                setShowOther(false);
              }
            }}
            disabled={otherDraft.trim().length === 0}
            className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
          >
            Use
          </button>
        </div>
      )}
    </div>
  );
}
