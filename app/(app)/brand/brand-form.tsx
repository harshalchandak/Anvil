"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, Plus, X as XIcon } from "lucide-react";
import { saveBrandProfile, type BrandActionResult } from "./actions";
import { GradientButton } from "@/components/ui/gradient-button";

// =========================================================================
// Niche presets + the audience/goal/tone suggestions that go with each one.
// "General" is the fallback set merged with every niche so the dropdowns are
// never embarrassingly thin.
// =========================================================================

type Suggestions = {
  audience: string[];
  goal: string[];
  tone: string[];
};

const GENERAL_SUGGESTIONS: Suggestions = {
  audience: [
    "Founders and indie hackers",
    "Solo creators monetizing",
    "Marketing & growth operators",
    "Engineering & product leaders",
    "Designers shipping products",
  ],
  goal: [
    "Grow followers (1k → 10k → 100k)",
    "Drive product trial signups",
    "Newsletter subscribers",
    "Inbound consulting / DMs",
    "Establish authority in the niche",
  ],
  tone: [
    "Direct, no fluff",
    "Playful with dry humor",
    "Thoughtful & nuanced",
    "Opinionated & a little spicy",
    "Warm, conversational, friendly",
  ],
};

const NICHE_DETAILS: Record<string, Suggestions> = {
  "AI productivity for indie founders": {
    audience: [
      "Solo founders shipping with AI",
      "Bootstrappers MRR 0–10k",
      "Product builders evaluating LLM tools",
    ],
    goal: [
      "Drive product trial signups",
      "Newsletter on AI workflows",
      "Demo-call bookings",
    ],
    tone: [
      "Direct, builder-to-builder",
      "Opinionated about what's hype vs real",
      "Curious & exploratory",
    ],
  },
  "Indie SaaS / micro-SaaS": {
    audience: [
      "Bootstrapped founders, MRR 0–10k",
      "Solo devs shipping side-projects",
      "Wantrepreneurs picking their first idea",
    ],
    goal: [
      "Drive trial → paid conversion",
      "MRR growth + retention",
      "Build in public audience",
    ],
    tone: [
      "Wry & opinionated",
      "Lessons-from-the-trenches",
      "Numbers & receipts > vibes",
    ],
  },
  "Solo devs shipping side projects": {
    audience: [
      "Indie devs with day jobs",
      "Open-source maintainers",
      "Hackathon-style builders",
    ],
    goal: [
      "Newsletter subscribers",
      "GitHub stars / OSS adoption",
      "First 100 users for a side project",
    ],
    tone: [
      "Builder-to-builder",
      "Casual, dev-Twitter native",
      "Show-not-tell, code-forward",
    ],
  },
  "Product design & systems": {
    audience: [
      "Designers shipping at SaaS companies",
      "Design system maintainers",
      "Heads of design / design leads",
    ],
    goal: [
      "Inbound consulting work",
      "Speaking opportunities",
      "Newsletter on craft & process",
    ],
    tone: [
      "Crafted, considered, visual-first",
      "Quietly opinionated",
      "Teach by showing examples",
    ],
  },
  "B2B SaaS marketing": {
    audience: [
      "Heads of growth at Series A/B",
      "B2B content marketers",
      "Demand-gen operators",
    ],
    goal: [
      "Pipeline / sales-qualified leads",
      "Speaking + podcast bookings",
      "Inbound consulting",
    ],
    tone: [
      "Confident & data-backed",
      "Frameworks > vibes",
      "Strong takes on common myths",
    ],
  },
  "DTC ecommerce growth": {
    audience: [
      "DTC operators, $1M–$20M GMV",
      "Shopify store founders",
      "Performance marketers",
    ],
    goal: [
      "Agency client inbound",
      "Sell a course or playbook",
      "Grow newsletter",
    ],
    tone: [
      "Tactical, screenshot-heavy",
      "Receipts > theory",
      "Direct & punchy",
    ],
  },
  "Content creators & solopreneurs": {
    audience: [
      "Newsletter writers under 10k",
      "Creators monetizing audience",
      "Coaches & info-product sellers",
    ],
    goal: [
      "Grow followers + email list",
      "Sell a digital product or cohort",
      "Booked speaking / coaching",
    ],
    tone: [
      "Warm & personal",
      "Vulnerable & honest",
      "Playful with depth",
    ],
  },
  "AI / ML engineers": {
    audience: [
      "ML engineers at Series B+ startups",
      "Applied scientists & researchers",
      "Devs adopting LLMs in production",
    ],
    goal: [
      "Recruiting / personal brand",
      "Newsletter & deep-dive writing",
      "Open-source adoption",
    ],
    tone: [
      "Technical & precise",
      "Skeptical of hype",
      "Show benchmarks > claims",
    ],
  },
  "Engineering leadership": {
    audience: [
      "Eng managers / staff engineers",
      "CTOs at Series A → C",
      "Tech leads at scale-ups",
    ],
    goal: [
      "Recruiting / employer brand",
      "Speaking + advisory",
      "Establish authority on a topic",
    ],
    tone: [
      "Considered & senior",
      "Story-driven",
      "Strong but humble takes",
    ],
  },
  "Web3 / crypto": {
    audience: [
      "Crypto-native builders",
      "DeFi protocol users",
      "Web3 founders & operators",
    ],
    goal: [
      "Token / protocol awareness",
      "Newsletter subscribers",
      "Discord / community growth",
    ],
    tone: [
      "Native, jargon-aware",
      "Skeptical, due-diligence first",
      "Builder-to-builder",
    ],
  },
  "Personal finance": {
    audience: [
      "Millennials starting to invest",
      "FIRE-curious knowledge workers",
      "Side-income earners",
    ],
    goal: [
      "Newsletter subscribers",
      "Sell a course / cohort",
      "Affiliate referrals",
    ],
    tone: [
      "Warm & demystifying",
      "Story-first, math second",
      "Skeptical of hype products",
    ],
  },
  "Fitness & wellness": {
    audience: [
      "Knowledge workers 25–40",
      "New parents reclaiming routines",
      "Strength-training intermediates",
    ],
    goal: [
      "1:1 coaching inquiries",
      "Sell a program / app",
      "Grow community",
    ],
    tone: [
      "Encouraging & approachable",
      "Evidence-based",
      "Specific, no vague platitudes",
    ],
  },
  "Career & coaching": {
    audience: [
      "Senior ICs eyeing leadership",
      "Mid-career switchers",
      "Job-seekers in tech",
    ],
    goal: [
      "Coaching client inquiries",
      "Sell a cohort",
      "Speaking / panels",
    ],
    tone: [
      "Empathetic & specific",
      "Frameworks + stories",
      "Direct, not preachy",
    ],
  },
  "Newsletter & writing": {
    audience: [
      "Aspiring newsletter writers",
      "Writers building a paid list",
      "Operators who write on the side",
    ],
    goal: [
      "Grow subscribers",
      "Paid conversion + churn fixes",
      "Sell course / cohort",
    ],
    tone: [
      "Crafted prose-forward",
      "Honest about the slog",
      "Show-don't-tell",
    ],
  },
  "Agency & consulting": {
    audience: [
      "Agency / consultancy owners",
      "Solo consultants $5k–$30k retainers",
      "Operators going independent",
    ],
    goal: [
      "Inbound client inquiries",
      "Higher retainer / better clients",
      "Recruit operators",
    ],
    tone: [
      "Senior, strategic",
      "Numbers + cases over fluff",
      "Calm authority",
    ],
  },
};

const NICHE_OPTIONS = Object.keys(NICHE_DETAILS);

// =========================================================================
// Suggested X (Twitter) competitors per niche. These are publicly-known
// accounts that consistently post in each category — pick what you want to
// learn from, then add your own. The Trend Research agent uses these to seed
// its sweeps.
// =========================================================================

const NICHE_COMPETITORS: Record<string, string[]> = {
  "AI productivity for indie founders": [
    "levelsio",
    "dvassallo",
    "transitive_bs",
    "swyx",
    "marc_louvion",
    "yongfook",
  ],
  "Indie SaaS / micro-SaaS": [
    "levelsio",
    "dvassallo",
    "tdinh_me",
    "marc_louvion",
    "yongfook",
    "danielvassallo",
  ],
  "Solo devs shipping side projects": [
    "levelsio",
    "tdinh_me",
    "marc_louvion",
    "shl",
    "yongfook",
    "patrickcmiller",
  ],
  "Product design & systems": [
    "iamralch",
    "mds",
    "mengto",
    "csswizardry",
    "jongold",
    "soulchildpls",
  ],
  "B2B SaaS marketing": [
    "april_dunford",
    "lennysan",
    "WesKao",
    "kevin_indig",
    "april",
    "DaveGerhardt",
  ],
  "DTC ecommerce growth": [
    "ezracaplan",
    "moiz_ali",
    "TaylorRH",
    "jrcalabrese",
    "alexlieberman",
    "RossSimmonds",
  ],
  "Content creators & solopreneurs": [
    "JustinWelsh",
    "dickiebush",
    "Nicolascole77",
    "joulee",
    "noahkagan",
    "TheSweatyStartup",
  ],
  "AI / ML engineers": [
    "karpathy",
    "ylecun",
    "swyx",
    "drjwrae",
    "_aigi",
    "jxmnop",
  ],
  "Engineering leadership": [
    "lethain",
    "sgblank",
    "shreyas",
    "WillLarson",
    "patio11",
    "Fwiff",
  ],
  "Web3 / crypto": [
    "VitalikButerin",
    "balajis",
    "cdixon",
    "tayvano_",
    "punk6529",
    "DeFi_Made_Here",
  ],
  "Personal finance": [
    "iwillteachyou",
    "MorganHousel",
    "TheRamseyShow",
    "thefinancetwins",
    "BudgetGirlSeo",
    "humphreytalks",
  ],
  "Fitness & wellness": [
    "MikeIsraetel",
    "AlanARoberts",
    "hubermanlab",
    "drmikevarshavski",
    "MarkBellsPowerProject",
    "AOCFitness",
  ],
  "Career & coaching": [
    "lennysan",
    "shreyas",
    "JustinWelsh",
    "WesKao",
    "thrivecareercom",
    "drlauraflower",
  ],
  "Newsletter & writing": [
    "JustinWelsh",
    "dickiebush",
    "Nicolascole77",
    "alexlieberman",
    "JackButcher",
    "joulee",
  ],
  "Agency & consulting": [
    "JustinWelsh",
    "TheSweatyStartup",
    "alexberman",
    "andrewthomson",
    "ChrisDoOnline",
    "GuyKawasaki",
  ],
};

const GENERAL_COMPETITORS = [
  "JustinWelsh",
  "levelsio",
  "dvassallo",
  "swyx",
  "noahkagan",
  "shreyas",
];

function competitorsFor(niche: string): string[] {
  const niched = NICHE_COMPETITORS[niche];
  return niched && niched.length > 0
    ? dedupe([...niched, ...GENERAL_COMPETITORS])
    : GENERAL_COMPETITORS;
}

function suggestionsFor(niche: string): Suggestions {
  const detail = NICHE_DETAILS[niche];
  if (!detail) return GENERAL_SUGGESTIONS;
  return {
    audience: dedupe([...detail.audience, ...GENERAL_SUGGESTIONS.audience]),
    goal: dedupe([...detail.goal, ...GENERAL_SUGGESTIONS.goal]),
    tone: dedupe([...detail.tone, ...GENERAL_SUGGESTIONS.tone]),
  };
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// =========================================================================
// Component
// =========================================================================

export type BrandInitial = {
  id: string;
  niche: string;
  audience: string;
  goal: string;
  tone: string;
  frequency: string;
  approvalMode: "manual" | "autopilot";
  sampleStyle: string;
  bannedWordsCsv: string;
  competitorsCsv: string;
  ctaPreference: string;
} | null;

export function BrandForm({ initial }: { initial: BrandInitial }) {
  const [state, action, pending] = useActionState<BrandActionResult | null, FormData>(
    saveBrandProfile,
    null,
  );

  // Lift niche state up so audience / goal / tone selects can react to it.
  const initialNicheIsPreset =
    !!initial?.niche && NICHE_OPTIONS.includes(initial.niche);
  const [nicheSelection, setNicheSelection] = useState<string>(
    !initial?.niche ? "" : initialNicheIsPreset ? initial.niche : "__other__",
  );
  const [nicheCustom, setNicheCustom] = useState<string>(
    !initial?.niche || initialNicheIsPreset ? "" : initial.niche,
  );

  const activeNiche =
    nicheSelection === "__other__"
      ? nicheCustom
      : nicheSelection === ""
        ? ""
        : nicheSelection;

  // Recompute suggestions when active niche changes.
  const suggestions = useMemo(() => suggestionsFor(activeNiche), [activeNiche]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <Section title="Identity" hint="Who you are and who you're talking to.">
        <Grid>
          <NicheSelect
            selection={nicheSelection}
            setSelection={setNicheSelection}
            custom={nicheCustom}
            setCustom={setNicheCustom}
          />
          <RelatedSelect
            label="Audience"
            name="audience"
            options={suggestions.audience}
            defaultValue={initial?.audience ?? ""}
            customPlaceholder="e.g. Heads of design at Series B SaaS"
            required
          />
          <RelatedSelect
            label="Goal"
            name="goal"
            options={suggestions.goal}
            defaultValue={initial?.goal ?? ""}
            customPlaceholder="e.g. 50 demo bookings / month"
            required
          />
          <RelatedSelect
            label="Tone"
            name="tone"
            options={suggestions.tone}
            defaultValue={initial?.tone ?? ""}
            customPlaceholder="e.g. Tender & curious, no jokes"
            required
          />
        </Grid>
        {activeNiche && (
          <p className="text-xs text-neutral-500">
            Suggestions tuned for{" "}
            <span className="font-medium text-neutral-700">{activeNiche}</span>.
            Pick one or type your own.
          </p>
        )}
      </Section>

      <Section title="Cadence & autonomy" hint="How often, and how hands-on.">
        <Grid>
          <Select
            label="Frequency"
            name="frequency"
            defaultValue={initial?.frequency ?? "daily"}
            options={[
              { value: "daily", label: "Daily" },
              { value: "every-2-days", label: "Every 2 days" },
              { value: "3x-per-week", label: "3x per week" },
              { value: "weekly", label: "Weekly" },
            ]}
          />
          <Select
            label="Approval mode"
            name="approvalMode"
            defaultValue={initial?.approvalMode ?? "manual"}
            options={[
              { value: "manual", label: "Manual — I approve every post" },
              { value: "autopilot", label: "Autopilot — ship at scheduled time" },
            ]}
          />
        </Grid>
      </Section>

      <Section title="Guardrails" hint="Voice samples and words to avoid.">
        <TextArea
          label="Sample style snippet"
          name="sampleStyle"
          defaultValue={initial?.sampleStyle ?? ""}
          placeholder="Paste 1–2 paragraphs of writing in your voice. Tweets work best."
          rows={4}
        />
        <Field
          label="Banned words"
          name="bannedWordsCsv"
          defaultValue={initial?.bannedWordsCsv ?? ""}
          placeholder="hustle, ninja, rockstar"
          hint="Comma-separated"
        />
        <CompetitorsChips
          defaultValue={initial?.competitorsCsv ?? ""}
          activeNiche={activeNiche}
        />
        <Field
          label="Preferred CTA"
          name="ctaPreference"
          defaultValue={initial?.ctaPreference ?? ""}
          placeholder="Reply 'guide' for the free playbook"
          hint="Optional"
        />
      </Section>

      {state && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : "border-red-100 bg-red-50 text-red-800"
          }`}
        >
          {state.ok ? "Saved. Your AI team is briefed." : state.error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <GradientButton type="submit" variant="gradient" disabled={pending}>
          {pending ? (
            "Saving…"
          ) : (
            <>
              <Check size={14} />
              {initial ? "Save changes" : "Create brand profile"}
            </>
          )}
        </GradientButton>
      </div>
    </form>
  );
}

// =========================================================================
// Helpers
// =========================================================================

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-[0_4px_18px_rgba(0,0,0,0.04)]">
      <header className="mb-5">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        <p className="text-sm text-neutral-500">{hint}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 ${extra}`;
}

function NicheSelect({
  selection,
  setSelection,
  custom,
  setCustom,
}: {
  selection: string;
  setSelection: (v: string) => void;
  custom: string;
  setCustom: (v: string) => void;
}) {
  const submitted =
    selection === "__other__" ? custom : selection === "" ? "" : selection;

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        Niche
      </span>
      <input type="hidden" name="niche" value={submitted} required />
      <select
        value={selection}
        onChange={(e) => setSelection(e.target.value)}
        className={inputClass()}
        required
      >
        <option value="" disabled>
          Pick a niche…
        </option>
        {NICHE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value="__other__">Other (type your own)</option>
      </select>
      {selection === "__other__" && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. Education tech for K-12 teachers"
          required
          autoFocus
          className={inputClass("mt-2")}
        />
      )}
    </label>
  );
}

/**
 * A field that swaps between a select-of-suggestions and a free-text "Other"
 * input. The currently-displayed options come from the active niche, so when
 * the user picks a new niche the suggestions update — but any value they
 * already typed (or that came from a saved row) is preserved.
 */
function RelatedSelect({
  label,
  name,
  options,
  defaultValue,
  customPlaceholder,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue: string;
  customPlaceholder: string;
  required?: boolean;
}) {
  // Value the user has actually committed to (preset choice OR typed text).
  // Initialised from defaultValue so existing rows hydrate correctly.
  const [value, setValue] = useState<string>(defaultValue);
  // Whether the "Other / type your own" input is active.
  const initialOther =
    !!defaultValue && !options.includes(defaultValue);
  const [otherMode, setOtherMode] = useState<boolean>(initialOther);

  // If the niche changes, `options` changes too. If the current value is no
  // longer in the new options AND the user hadn't already opted into "Other",
  // we keep their value and quietly switch to Other mode so nothing is lost.
  useEffect(() => {
    if (!otherMode && value && !options.includes(value)) {
      setOtherMode(true);
    }
  }, [options, value, otherMode]);

  function onSelect(v: string) {
    if (v === "__other__") {
      setOtherMode(true);
      // Don't clobber any text they had — just open the Other input.
      return;
    }
    setOtherMode(false);
    setValue(v);
  }

  const selectValue = otherMode ? "__other__" : value;

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {label}
      </span>
      <input type="hidden" name={name} value={value} required={required} />
      <select
        value={options.includes(selectValue) || selectValue === "__other__" ? selectValue : ""}
        onChange={(e) => onSelect(e.target.value)}
        className={inputClass()}
        required={required}
      >
        <option value="" disabled>
          Pick one…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value="__other__">Other (type your own)</option>
      </select>
      {otherMode && (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={customPlaceholder}
          required={required}
          autoFocus
          className={inputClass("mt-2")}
        />
      )}
    </label>
  );
}

function normaliseHandle(input: string): string {
  return input.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
}

/**
 * Competitor X accounts. Pre-seeds chip suggestions from the active niche,
 * lets the user click to add, and accepts free-text @handles via the input.
 * Stored as a hidden CSV under name="competitorsCsv" so the existing server
 * action keeps working unchanged.
 */
function CompetitorsChips({
  defaultValue,
  activeNiche,
}: {
  defaultValue: string;
  activeNiche: string;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    defaultValue
      .split(",")
      .map((s) => normaliseHandle(s))
      .filter(Boolean),
  );
  const [draft, setDraft] = useState("");

  const suggestions = useMemo(() => competitorsFor(activeNiche), [activeNiche]);
  const unpicked = suggestions.filter((s) => !selected.includes(s));

  function add(handle: string) {
    const h = normaliseHandle(handle);
    if (!h) return;
    if (selected.includes(h)) return;
    setSelected((cur) => [...cur, h]);
  }

  function remove(handle: string) {
    setSelected((cur) => cur.filter((h) => h !== handle));
  }

  function commitDraft() {
    if (!draft.trim()) return;
    add(draft);
    setDraft("");
  }

  return (
    <div className="block">
      <input type="hidden" name="competitorsCsv" value={selected.join(",")} />
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        Competitors on X
      </span>

      {/* Selected chips + manual handle input */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
        {selected.length === 0 && draft.length === 0 && (
          <span className="text-sm text-neutral-400">
            Pick from suggestions below, or type your own @handle and press Enter.
          </span>
        )}
        {selected.map((h) => (
          <span
            key={h}
            className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-100"
          >
            @{h}
            <button
              type="button"
              onClick={() => remove(h)}
              className="text-violet-500 transition hover:text-violet-800"
              aria-label={`Remove ${h}`}
            >
              <XIcon size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Backspace" && !draft && selected.length > 0) {
              setSelected((cur) => cur.slice(0, -1));
            }
          }}
          onBlur={commitDraft}
          placeholder={selected.length > 0 ? "Add another" : "@founderusername"}
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
        />
      </div>

      {/* Niche-aware suggestions */}
      {unpicked.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
            {activeNiche
              ? `Suggested for ${activeNiche}`
              : "Popular X accounts in this space"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {unpicked.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => add(h)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--border-subtle)] bg-white px-2.5 py-0.5 text-xs text-neutral-600 transition hover:border-violet-300 hover:text-violet-700"
              >
                <Plus size={10} />@{h}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-neutral-500">
        We learn from their post patterns. We never copy their words.
      </p>
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {props.label}
      </span>
      <input
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        required={props.required}
        className={inputClass()}
      />
      {props.hint && (
        <span className="mt-1 block text-xs text-neutral-500">{props.hint}</span>
      )}
    </label>
  );
}

function TextArea(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {props.label}
      </span>
      <textarea
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        rows={props.rows ?? 3}
        className={inputClass("resize-y")}
      />
    </label>
  );
}

function Select(props: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
        {props.label}
      </span>
      <select
        name={props.name}
        defaultValue={props.defaultValue}
        className={inputClass()}
      >
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
