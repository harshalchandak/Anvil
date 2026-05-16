import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { brandProfiles } from "@/db/schema";
import { tryDbQuery } from "@/db/safe";
import { requireAppUser } from "@/lib/auth";
import { getDemoBrand } from "@/lib/demo-brand";
import { apiError, apiOk } from "@/lib/api";
import { env, isXConfigured } from "@/lib/env";

type BrandLike = {
  niche: string;
  audience: string;
  goal: string;
  tone: string;
  sampleStyle: string | null;
  competitors: string[];
  bannedWords: string[];
  ctaPreference: string | null;
};

const PostSchema = z.object({
  text: z
    .string()
    .min(40)
    .max(280),
});

/**
 * One-shot tweet generator used by the dashboard "Start growth run" button.
 *
 * Tries an LLM first if a key is configured (Anthropic or Grok via the
 * Vercel AI SDK). Falls back to a deterministic, on-brand template otherwise
 * so the hackathon flow has a guaranteed result even with no API keys set.
 *
 * Reads the brand from the public.brand_profiles row OR the demo cookie —
 * whichever exists. Returns `{ text }`; the client redirects to
 * /dashboard?draft=<text> which pre-fills the Quick Post textarea.
 */
export async function POST() {
  const { appUser } = await requireAppUser();

  // 1) Resolve the brand profile from DB or demo cookie.
  const dbBrand = await tryDbQuery(
    async () =>
      (
        await db
          .select()
          .from(brandProfiles)
          .where(eq(brandProfiles.userId, appUser.id))
          .limit(1)
      )[0] ?? null,
    null,
  );

  let brand: BrandLike | null = null;
  if (dbBrand) {
    brand = {
      niche: dbBrand.niche,
      audience: dbBrand.audience,
      goal: dbBrand.goal,
      tone: dbBrand.tone,
      sampleStyle: dbBrand.sampleStyle,
      competitors: dbBrand.competitors ?? [],
      bannedWords: dbBrand.bannedWords ?? [],
      ctaPreference: dbBrand.ctaPreference,
    };
  } else {
    const cookie = await getDemoBrand();
    if (cookie) {
      brand = {
        niche: cookie.niche,
        audience: cookie.audience,
        goal: cookie.goal,
        tone: cookie.tone,
        sampleStyle: cookie.sampleStyle,
        competitors: cookie.competitors,
        bannedWords: cookie.bannedWords,
        ctaPreference: cookie.ctaPreference,
      };
    }
  }

  if (!brand) {
    return apiError(
      "No brand profile yet. Save your brand at /brand first.",
      404,
    );
  }

  // 2) Try LLM, fall back to template.
  let text: string;
  const hasAnthropic =
    env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY !== "placeholder-anthropic-key";
  const hasGrok = isXConfigured() && env.XAI_API_KEY;
  const llmReady = hasAnthropic || hasGrok;

  if (llmReady) {
    try {
      const { generateStructured } = await import("@/clients/llm");
      const out = await generateStructured({
        schema: PostSchema,
        system: buildSystemPrompt(brand),
        prompt: buildUserPrompt(brand),
      });
      text = out.text;
    } catch (err) {
      console.error("[POST /api/quick-generate] LLM failed, using template:", err);
      text = templateTweet(brand);
    }
  } else {
    text = templateTweet(brand);
  }

  // Final scrub: enforce 280 cap and strip any banned words.
  text = scrubBannedWords(text, brand.bannedWords).slice(0, 280);

  return apiOk({ text, source: llmReady ? "llm" : "template" });
}

// =========================================================================
// LLM prompts
// =========================================================================

function buildSystemPrompt(b: BrandLike): string {
  return [
    "You write tweets for a single creator's X account.",
    `Niche: ${b.niche}.`,
    `Audience: ${b.audience}.`,
    `Goal: ${b.goal}.`,
    `Tone: ${b.tone}.`,
    b.sampleStyle ? `Voice samples to match:\n${b.sampleStyle}` : "",
    b.bannedWords.length
      ? `Never use these words: ${b.bannedWords.join(", ")}.`
      : "",
    "Write ONE post under 280 characters.",
    "No hashtags unless the user's samples use them.",
    "No fluff openers like 'I think' or 'In my opinion'.",
    "Open with a hook a reader can't scroll past.",
    "Return strict JSON: { \"text\": string }",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildUserPrompt(b: BrandLike): string {
  return [
    "Compose one original tweet for this brand.",
    "Pick a specific, opinionated angle.",
    "Make it concrete — numbers, named patterns, or a contrarian rule.",
    "End strong — not a question, not a CTA unless that's what the audience expects.",
    b.ctaPreference
      ? `If you do add a CTA, prefer: "${b.ctaPreference}".`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// =========================================================================
// Template fallback — produces an on-brand tweet from the brand fields when
// no LLM key is configured. Deterministic so the hackathon demo always works.
// =========================================================================

function templateTweet(b: BrandLike): string {
  const hooks = HOOKS_BY_NICHE[b.niche] ?? GENERIC_HOOKS;
  const hook = hooks[hashIndex(`${b.niche}:${b.audience}`, hooks.length)]!;

  const aud = trimTrailingPeriod(b.audience);
  const goalLine = pickGoalLine(b.goal);

  const body = `${hook} (${aud})\n\n${goalLine}`;
  return scrubBannedWords(body, b.bannedWords).slice(0, 280);
}

function pickGoalLine(goal: string): string {
  const g = goal.toLowerCase();
  if (g.includes("trial") || g.includes("signup")) {
    return "Stop polishing the landing page. Talk to 5 users this week. The first one will tell you what to ship.";
  }
  if (g.includes("follow")) {
    return "Pick the boring promise nobody else will make in your space. Then keep it for 30 days. Followers follow.";
  }
  if (g.includes("newsletter") || g.includes("subscrib")) {
    return "Your newsletter doesn't need 10k subscribers. It needs 100 who'd be furious if it stopped showing up.";
  }
  if (g.includes("inbound") || g.includes("consult") || g.includes("client")) {
    return "Inbound doesn't come from being clever. It comes from being unmistakably specific about one problem you can fix.";
  }
  if (g.includes("authority") || g.includes("brand")) {
    return "Authority isn't volume. It's having one opinion you'll defend in writing every week for a year.";
  }
  return "The single best move this week: pick one rule for your work, write it down, and follow it. Specificity compounds.";
}

const GENERIC_HOOKS = [
  "Most people in this game won't admit the boring truth:",
  "The thing nobody tells you about getting traction:",
  "Unpopular opinion that holds up under scrutiny:",
  "Three years in, the only thing that consistently worked:",
  "What I'd tell myself if I were starting over today:",
];

const HOOKS_BY_NICHE: Record<string, string[]> = {
  "Indie SaaS / micro-SaaS": [
    "Most indie founders quit at month 4. Not because the product fails — because nobody warned them about the wall:",
    "Your first 10 paid users won't come from a viral tweet. They come from being unmistakably specific:",
    "The boring truth about hitting $1k MRR:",
    "What stops bootstrappers isn't competition — it's running out of belief on a Tuesday:",
  ],
  "AI productivity for indie founders": [
    "AI productivity tools that actually save time have one thing in common:",
    "After trying 30+ AI tools as a solo founder, the only ones that stuck:",
    "Most AI productivity advice is for people with teams. What works when it's just you:",
  ],
  "Solo devs shipping side projects": [
    "Your side project doesn't need a launch. It needs one user who can't stop using it:",
    "If your side project hasn't shipped in 30 days, the problem isn't time. It's scope:",
  ],
  "Product design & systems": [
    "Design systems fail for the same reason most teams ignore — and it isn't tokens:",
    "The fastest way to ship better UI: stop polishing components, start polishing decisions:",
  ],
  "B2B SaaS marketing": [
    "B2B SaaS pipeline gets stuck in the same place every time. It isn't the funnel:",
    "Stop measuring MQLs. Start measuring whether your buyer can describe your product in one sentence after they leave the page:",
  ],
  "DTC ecommerce growth": [
    "DTC margins die in the same three places. Nobody tracks the third one:",
    "Your ad account isn't broken. Your offer is. Specifically:",
  ],
  "Content creators & solopreneurs": [
    "The creators who actually compound aren't the ones posting daily. They're the ones with one defendable opinion:",
    "Newsletter growth doesn't come from cross-posting. It comes from one piece a month people forward to a friend:",
  ],
  "AI / ML engineers": [
    "Most LLM apps in prod share one architectural mistake — and it isn't picking the wrong model:",
    "The hardest part of shipping AI features isn't quality. It's evals you can trust at 2am:",
  ],
  "Engineering leadership": [
    "Engineering managers fail in the same way the same week of every quarter:",
    "Stop running 1:1s about deliverables. The 90-minute conversation that actually moves people:",
  ],
  "Personal finance": [
    "Most personal finance advice falls apart for one reason — and it isn't math:",
    "If you can't tell me your monthly burn from memory, you don't have a budget. You have a feeling:",
  ],
  "Fitness & wellness": [
    "The fitness routine that actually compounds has one boring property:",
    "Most people quit at week 6 — and it isn't motivation. It's a planning mistake you can fix in 10 minutes:",
  ],
  "Career & coaching": [
    "Senior ICs who jump to leadership well share one habit. Almost nobody copies it:",
    "Your career stalls at the same level for everyone. Here's the one shift that broke it for me:",
  ],
  "Newsletter & writing": [
    "Newsletters under 1,000 subscribers fail in the same week of the same month:",
    "The single best move for any newsletter writer in their first year — and it isn't growth:",
  ],
  "Agency & consulting": [
    "Most agency owners cap out at the same revenue number for the same reason:",
    "If you're a solo consultant under $10k retainers, the move isn't more leads. It's:",
  ],
  "Web3 / crypto": [
    "The crypto projects that actually shipped useful things share one boring trait:",
    "Web3 onboarding fails in the same place every time:",
  ],
};

// =========================================================================
// Helpers
// =========================================================================

function trimTrailingPeriod(s: string): string {
  return s.replace(/[.\s]+$/, "");
}

function hashIndex(input: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h) % modulo;
}

function scrubBannedWords(text: string, banned: string[]): string {
  if (banned.length === 0) return text;
  let out = text;
  for (const w of banned) {
    if (!w) continue;
    const re = new RegExp(`\\b${escapeRegex(w)}\\b`, "gi");
    out = out.replace(re, "—");
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
