/* Mock data so every page renders something realistic without backend.
   Anything generated here is purely cosmetic. */

export type AgentKey =
  | "research"
  | "pattern"
  | "strategy"
  | "copy"
  | "voice"
  | "carousel"
  | "quality"
  | "analytics";

export const AGENTS: Record<
  AgentKey,
  { name: string; role: string; tagline: string; color: string; icon: string }
> = {
  research: {
    name: "Research",
    role: "Hunts live trends",
    tagline:
      "Scans X conversations, news, and creator chatter for what your audience actually cares about right now.",
    color: "from-violet-500 to-fuchsia-500",
    icon: "Compass",
  },
  pattern: {
    name: "Viral Pattern",
    role: "Spots what's working",
    tagline:
      "Extracts the structural moves behind top-performing posts so we can borrow shapes, not words.",
    color: "from-pink-500 to-rose-500",
    icon: "Sparkles",
  },
  strategy: {
    name: "Strategy",
    role: "Plans the week",
    tagline:
      "Composes 5 posts and a carousel from research + patterns, paced to your cadence.",
    color: "from-orange-500 to-amber-500",
    icon: "Layers",
  },
  copy: {
    name: "Copywriting",
    role: "Drafts variants",
    tagline:
      "Writes 2–3 angles per idea — hook, body, optional thread — never copies sources verbatim.",
    color: "from-amber-500 to-yellow-500",
    icon: "PenLine",
  },
  voice: {
    name: "Brand Voice",
    role: "Sounds like you",
    tagline:
      "Rewrites for tone match, scrubs banned words, scores human-likeness 1–10.",
    color: "from-emerald-500 to-teal-500",
    icon: "AudioLines",
  },
  carousel: {
    name: "Carousel",
    role: "Designs slide decks",
    tagline:
      "Outlines 8 slides — hook, context, insight, framework, example, takeaway, CTA, signature.",
    color: "from-cyan-500 to-blue-500",
    icon: "Images",
  },
  quality: {
    name: "Quality",
    role: "Strict reviewer",
    tagline:
      "Scores hook strength, clarity, originality, brand-fit, human-likeness. Sends back below 6/10.",
    color: "from-blue-500 to-indigo-500",
    icon: "ShieldCheck",
  },
  analytics: {
    name: "Analytics",
    role: "Closes the loop",
    tagline:
      "Pulls metrics every 6h, surfaces the best hook style, time, and topic to repeat.",
    color: "from-indigo-500 to-violet-500",
    icon: "LineChart",
  },
};

export const AGENT_ORDER: AgentKey[] = [
  "research",
  "pattern",
  "strategy",
  "copy",
  "voice",
  "carousel",
  "quality",
  "analytics",
];

export type MockRun = {
  id: string;
  niche: string;
  status: "running" | "completed" | "failed" | "partial";
  startedAtIso: string;
  durationSec: number;
  postsGenerated: number;
  carouselsGenerated: number;
  agentsUsed: AgentKey[];
};

export const MOCK_RUNS: MockRun[] = [
  {
    id: "run_01HX9QWE2T",
    niche: "AI productivity for indie founders",
    status: "completed",
    startedAtIso: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    durationSec: 134,
    postsGenerated: 5,
    carouselsGenerated: 1,
    agentsUsed: AGENT_ORDER.slice(0, 7),
  },
  {
    id: "run_01HX8R5V6J",
    niche: "Solo dev shipping micro-SaaS",
    status: "running",
    startedAtIso: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    durationSec: 0,
    postsGenerated: 2,
    carouselsGenerated: 0,
    agentsUsed: AGENT_ORDER.slice(0, 4),
  },
  {
    id: "run_01HX7M3K1A",
    niche: "Design systems for product teams",
    status: "completed",
    startedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    durationSec: 162,
    postsGenerated: 6,
    carouselsGenerated: 1,
    agentsUsed: AGENT_ORDER,
  },
  {
    id: "run_01HX6N2D9P",
    niche: "Email marketing for DTC brands",
    status: "partial",
    startedAtIso: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    durationSec: 98,
    postsGenerated: 3,
    carouselsGenerated: 0,
    agentsUsed: AGENT_ORDER.slice(0, 6),
  },
];

export type MockPost = {
  id: string;
  text: string;
  format: "single" | "thread" | "carousel";
  status: "draft" | "needs_revision" | "approved" | "scheduled" | "published";
  scheduledForIso: string;
  scores: {
    hook: number;
    clarity: number;
    originality: number;
    brandFit: number;
    humanLikeness: number;
  };
  reasoning: string;
  riskNotes: string | null;
};

const tomorrow = (h: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(h, 0, 0, 0);
  return d.toISOString();
};

export const MOCK_POSTS: MockPost[] = [
  {
    id: "post_001",
    text:
      "Your first 100 followers don't come from going viral. They come from being unmistakably specific.\n\nPick the boring promise nobody else will make. Then keep it for 30 days.",
    format: "single",
    status: "approved",
    scheduledForIso: tomorrow(15),
    scores: { hook: 9, clarity: 9, originality: 8, brandFit: 9, humanLikeness: 9 },
    reasoning:
      "Counter-intuitive opening + concrete prescription. Tested against the 'go viral' trope.",
    riskNotes: null,
  },
  {
    id: "post_002",
    text:
      "I built 7 SaaS apps before one made money.\n\nHere's what I learned about indie distribution — none of it is what 'build in public' tells you (a thread 🧵)",
    format: "thread",
    status: "scheduled",
    scheduledForIso: tomorrow(18),
    scores: { hook: 8, clarity: 8, originality: 7, brandFit: 9, humanLikeness: 9 },
    reasoning: "Authority + curiosity hook. Slight risk of 'thread bait' framing.",
    riskNotes: "Thread length 9 tweets — verify pacing.",
  },
  {
    id: "post_003",
    text:
      "Why 80% of Indie SaaS founders quit at month 4 (and the simple system that fixes it)",
    format: "carousel",
    status: "draft",
    scheduledForIso: tomorrow(13),
    scores: { hook: 9, clarity: 7, originality: 6, brandFit: 8, humanLikeness: 8 },
    reasoning: "Strong number hook. Originality marginal — refine framing.",
    riskNotes: null,
  },
  {
    id: "post_004",
    text:
      "Unpopular: every metric that matters in early SaaS fits on one index card.\n\nMRR, churn, week-1 activation, and a single qualitative line about who's miserable today.\n\nEverything else is theater.",
    format: "single",
    status: "approved",
    scheduledForIso: tomorrow(20),
    scores: { hook: 8, clarity: 9, originality: 9, brandFit: 9, humanLikeness: 10 },
    reasoning: "'Index card' visual hook, opinionated, specific. High shareability.",
    riskNotes: null,
  },
  {
    id: "post_005",
    text:
      "The hardest part of being a solo founder isn't building the product. It's that nobody else is going to celebrate the small wins. So you have to.",
    format: "single",
    status: "needs_revision",
    scheduledForIso: tomorrow(11),
    scores: { hook: 6, clarity: 8, originality: 5, brandFit: 7, humanLikeness: 9 },
    reasoning: "Sentiment is right but opener leans cliché.",
    riskNotes: "Originality 5/10 — borrow less, observe more.",
  },
];

export type MockCarouselSlide = {
  n: number;
  title: string;
  body: string;
};

export const MOCK_CAROUSEL: {
  id: string;
  caption: string;
  template: "minimal-dark" | "premium-light" | "founder-notes" | "neon-tech" | "soft-pastel";
  slides: MockCarouselSlide[];
} = {
  id: "carousel_001",
  template: "premium-light",
  caption:
    "Why 80% of indie SaaS founders quit at month 4 — and the simple system that fixes it. Save this.",
  slides: [
    { n: 1, title: "Month 4 is the wall.", body: "80% of indie SaaS founders quit here. Almost nobody warns you it's coming." },
    { n: 2, title: "Why?", body: "The honeymoon ends. Growth flattens. Doubt arrives. You're alone with a spreadsheet." },
    { n: 3, title: "The trap", body: "You start chasing new features instead of new users. Building > shipping > learning gets inverted." },
    { n: 4, title: "The fix in 3 moves", body: "Anchor on 1 metric. Talk to 5 users a week. Ship the smallest unblocker every Friday." },
    { n: 5, title: "Anchor metric", body: "Pick ONE. For most: weekly active. For some: paid trials. Never two at once." },
    { n: 6, title: "5 user calls / week", body: "Not interviews. Just calls. Listen for the verb they use when they describe the pain." },
    { n: 7, title: "Friday ships", body: "End every week with one shipped thing real users can touch. Tiny is fine. Shipped > perfect." },
    { n: 8, title: "Save this.", body: "If this hit, follow @netisize — we publish playbooks for solo founders every week." },
  ],
};

export type MockAgentStep = {
  id: string;
  agentKey: AgentKey;
  stepName: string;
  status: "pending" | "running" | "completed" | "failed";
  durationMs: number | null;
  message: string;
};

export const MOCK_TIMELINE: MockAgentStep[] = [
  { id: "s1", agentKey: "research", stepName: "research", status: "completed", durationMs: 8420, message: "Pulled 23 sources. Top themes: 'first 100 users', 'indie SaaS trap', 'shipping rituals'." },
  { id: "s2", agentKey: "pattern", stepName: "pattern-extraction", status: "completed", durationMs: 4120, message: "Matched 4 known patterns. Added 1 new: 'index-card opinionated take'." },
  { id: "s3", agentKey: "strategy", stepName: "plan", status: "completed", durationMs: 6890, message: "Composed 5 posts + 1 carousel, paced 3x/week through Friday." },
  { id: "s4", agentKey: "copy", stepName: "draft", status: "completed", durationMs: 12450, message: "Drafted 3 variants per idea. Best variant per slot selected." },
  { id: "s5", agentKey: "voice", stepName: "rewrite", status: "completed", durationMs: 5230, message: "Voice match 8.4/10 average. 2 banned words scrubbed." },
  { id: "s6", agentKey: "quality", stepName: "score", status: "completed", durationMs: 4880, message: "4 approved, 1 sent back to revision loop (originality 5/10)." },
  { id: "s7", agentKey: "carousel", stepName: "outline", status: "running", durationMs: null, message: "Outlining 8 slides for 'Why 80% quit at month 4'…" },
  { id: "s8", agentKey: "analytics", stepName: "fetch-and-learn", status: "pending", durationMs: null, message: "Will run 6h after first publish." },
];

export const MOCK_ANALYTICS = {
  totals: { impressions: 184_300, likes: 6_211, replies: 412, reposts: 1_820, bookmarks: 2_104 },
  series: [
    { day: "Mon", impressions: 14_200, engagement: 612 },
    { day: "Tue", impressions: 19_400, engagement: 821 },
    { day: "Wed", impressions: 22_800, engagement: 1_104 },
    { day: "Thu", impressions: 28_100, engagement: 1_488 },
    { day: "Fri", impressions: 36_900, engagement: 1_902 },
    { day: "Sat", impressions: 31_400, engagement: 1_512 },
    { day: "Sun", impressions: 31_500, engagement: 1_410 },
  ],
  topFormats: [
    { format: "Carousel", er: 4.7, change: 38 },
    { format: "Thread (5+)", er: 3.2, change: 12 },
    { format: "Single post", er: 1.9, change: -4 },
  ],
  insights: [
    {
      headline: "Carousels are outperforming single posts by 38%.",
      detail:
        "Especially when slide 1 frames a number ('80%', '$0 → $5K'). Lean into numeric hooks this week.",
      confidence: 0.84,
    },
    {
      headline: "Posts shipped Tue–Thu, 3–6pm UTC drive 2.1x the engagement.",
      detail:
        "Your audience clusters mid-week. Schedule the high-effort posts in that window.",
      confidence: 0.78,
    },
    {
      headline: "'Index card' / 'one rule' framings hit consistently.",
      detail:
        "5 of 7 top posts compress a complex idea into one constraint. Keep that lens.",
      confidence: 0.81,
    },
  ],
};

export const MOCK_FAQ = [
  {
    q: "How does Netisize avoid sounding like AI?",
    a: "The Brand Voice agent rewrites every draft to match samples you paste, scrubs banned words, and Quality Control benches anything below 8/10 human-likeness. You can always rewrite in your own voice — Netisize learns from your edits.",
  },
  {
    q: "Do you really post to my X account?",
    a: "Only if you say so. Manual mode (default) requires you to click Approve and Publish on every post. Autopilot is opt-in and gated by a second environment flag.",
  },
  {
    q: "Where does the research come from?",
    a: "Live web search via Tavily plus your own brand profile. Sources are linked in every run so you can verify what informed each post.",
  },
  {
    q: "Is anything 'reverse-engineering' the X algorithm?",
    a: "No. We analyze public engagement patterns — hooks, formats, timing — never the algorithm itself. The promise is craft, not exploit.",
  },
  {
    q: "Can I run Netisize on a schedule?",
    a: "Yes. Run on demand, on cron, or fire it from any webhook (Make, Zapier, n8n). Every run posts to /api/webhooks/content-trigger with HMAC signatures.",
  },
  {
    q: "What happens if a post performs badly?",
    a: "The Analytics agent pulls metrics every 6 hours and writes learning insights — best hook style, best time, topics to repeat or avoid. The next run uses them.",
  },
  {
    q: "What about carousels?",
    a: "The Carousel agent outlines 8 slides per template, Playwright renders each as a 1080×1350 PNG, then we post the first 4 in the root tweet and thread the rest.",
  },
  {
    q: "Can I export to other platforms?",
    a: "Yes — every post and carousel exports as plain text + PNG so you can mirror it to LinkedIn, Threads, Bluesky, or anywhere else.",
  },
];

export const MOCK_TESTIMONIALS = [
  {
    quote:
      "Netisize is the first AI tool that actually sounds like me. I approve maybe 1 in 3 drafts the first week. Now it's closer to 9 in 10.",
    name: "Maya Chen",
    role: "Indie SaaS, 23k followers",
  },
  {
    quote:
      "We replaced a $4k/mo agency. The carousel agent alone earns its keep — we ship 3 a week instead of 1.",
    name: "Diego Alvares",
    role: "Founder, Voltrack",
  },
  {
    quote:
      "The thing I didn't expect: the analytics agent telling me which of my own ideas weren't landing. Made me a better writer.",
    name: "Priya Subramaniam",
    role: "Design lead, ex-Stripe",
  },
];

export const MOCK_LOGOS = [
  "lattice",
  "verge",
  "nimbus",
  "fold.io",
  "okra labs",
  "moonlight",
];
