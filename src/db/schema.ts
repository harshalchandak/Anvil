import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  doublePrecision,
  boolean,
  bigint,
  uniqueIndex,
  index,
  vector,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// -----------------------------
// Enums
// -----------------------------

export const runStatusEnum = pgEnum("run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "partial",
]);

export const stepStatusEnum = pgEnum("step_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "retrying",
  "skipped",
]);

export const postStatusEnum = pgEnum("post_status", [
  "draft",
  "needs_revision",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
]);

export const approvalModeEnum = pgEnum("approval_mode", ["manual", "autopilot"]);

export const postFormatEnum = pgEnum("post_format", [
  "single",
  "thread",
  "carousel",
]);

export const traceLevelEnum = pgEnum("trace_level", [
  "debug",
  "info",
  "warn",
  "error",
]);

export const carouselStatusEnum = pgEnum("carousel_status", [
  "pending",
  "outlined",
  "rendering",
  "rendered",
  "partial",
  "published",
]);

// -----------------------------
// Shared column builders
// -----------------------------

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// -----------------------------
// users (mirror of auth.users)
// -----------------------------

export const users = pgTable(
  "users",
  {
    id: id(),
    authUserId: uuid("auth_user_id").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_auth_user_id_uniq").on(t.authUserId)],
);

// -----------------------------
// brand_profiles
// -----------------------------

export const brandProfiles = pgTable(
  "brand_profiles",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    niche: text("niche").notNull(),
    audience: text("audience").notNull(),
    goal: text("goal").notNull(),
    tone: text("tone").notNull(),
    frequency: text("frequency").notNull(),
    approvalMode: approvalModeEnum("approval_mode").notNull().default("manual"),
    sampleStyle: text("sample_style"),
    competitors: jsonb("competitors").$type<string[]>().notNull().default([]),
    bannedWords: text("banned_words").array().notNull().default(sql`'{}'::text[]`),
    ctaPreference: text("cta_preference"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("brand_profiles_user_idx").on(t.userId)],
);

// -----------------------------
// x_accounts
// -----------------------------

export const xAccounts = pgTable(
  "x_accounts",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    xUserId: text("x_user_id").notNull(),
    xUsername: text("x_username").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    scopes: text("scopes").array().notNull().default(sql`'{}'::text[]`),
    invalid: boolean("invalid").notNull().default(false),
    lastRefreshError: text("last_refresh_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("x_accounts_user_uniq").on(t.userId),
    uniqueIndex("x_accounts_x_user_uniq").on(t.xUserId),
  ],
);

// -----------------------------
// growth_runs
// -----------------------------

export const growthRuns = pgTable(
  "growth_runs",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandProfileId: uuid("brand_profile_id")
      .notNull()
      .references(() => brandProfiles.id, { onDelete: "cascade" }),
    triggerType: text("trigger_type").notNull(),
    niche: text("niche"),
    goal: text("goal"),
    status: runStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    summary: jsonb("summary").$type<Record<string, unknown>>(),
    error: text("error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("growth_runs_user_idx").on(t.userId),
    index("growth_runs_status_idx").on(t.status),
  ],
);

// -----------------------------
// agent_steps
// -----------------------------

export const agentSteps = pgTable(
  "agent_steps",
  {
    id: id(),
    growthRunId: uuid("growth_run_id")
      .notNull()
      .references(() => growthRuns.id, { onDelete: "cascade" }),
    parentStepId: uuid("parent_step_id").references(
      (): AnyPgColumn => agentSteps.id,
      { onDelete: "cascade" },
    ),
    agentName: text("agent_name").notNull(),
    stepName: text("step_name").notNull(),
    status: stepStatusEnum("status").notNull().default("pending"),
    inputJson: jsonb("input_json").$type<Record<string, unknown>>(),
    outputJson: jsonb("output_json").$type<Record<string, unknown>>(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    error: text("error"),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("agent_steps_run_idx").on(t.growthRunId),
    index("agent_steps_parent_idx").on(t.parentStepId),
  ],
);

// -----------------------------
// tool_call_logs
// -----------------------------

export const toolCallLogs = pgTable(
  "tool_call_logs",
  {
    id: id(),
    agentStepId: uuid("agent_step_id")
      .notNull()
      .references(() => agentSteps.id, { onDelete: "cascade" }),
    toolName: text("tool_name").notNull(),
    inputJson: jsonb("input_json").$type<Record<string, unknown>>(),
    outputJson: jsonb("output_json").$type<Record<string, unknown>>(),
    durationMs: integer("duration_ms"),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("tool_call_logs_step_idx").on(t.agentStepId)],
);

// -----------------------------
// research_sources
// -----------------------------

export const researchSources = pgTable(
  "research_sources",
  {
    id: id(),
    growthRunId: uuid("growth_run_id")
      .notNull()
      .references(() => growthRuns.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    snippet: text("snippet"),
    score: doublePrecision("score"),
    createdAt: createdAt(),
  },
  (t) => [index("research_sources_run_idx").on(t.growthRunId)],
);

// -----------------------------
// viral_patterns (global, not user-scoped)
// -----------------------------

export const viralPatterns = pgTable(
  "viral_patterns",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    whyItWorks: text("why_it_works").notNull(),
    exampleStructure: text("example_structure"),
    whenToUse: text("when_to_use"),
    riskLevel: text("risk_level").notNull().default("low"),
    ctaSuggestion: text("cta_suggestion"),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("viral_patterns_name_uniq").on(t.name)],
);

// -----------------------------
// content_ideas
// -----------------------------

export const contentIdeas = pgTable(
  "content_ideas",
  {
    id: id(),
    growthRunId: uuid("growth_run_id")
      .notNull()
      .references(() => growthRuns.id, { onDelete: "cascade" }),
    angle: text("angle").notNull(),
    format: postFormatEnum("format").notNull(),
    targetGoal: text("target_goal"),
    reasoning: text("reasoning"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("content_ideas_run_idx").on(t.growthRunId)],
);

// -----------------------------
// generated_posts
// -----------------------------

export const generatedPosts = pgTable(
  "generated_posts",
  {
    id: id(),
    growthRunId: uuid("growth_run_id")
      .notNull()
      .references(() => growthRuns.id, { onDelete: "cascade" }),
    contentIdeaId: uuid("content_idea_id").references(() => contentIdeas.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    format: postFormatEnum("format").notNull(),
    text: text("text").notNull(),
    threadJson: jsonb("thread_json").$type<string[]>(),
    status: postStatusEnum("status").notNull().default("draft"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    xPostId: text("x_post_id"),
    scoresJson: jsonb("scores_json").$type<Record<string, number>>(),
    reasoning: text("reasoning"),
    riskNotes: text("risk_notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("generated_posts_run_idx").on(t.growthRunId),
    index("generated_posts_user_idx").on(t.userId),
    index("generated_posts_status_idx").on(t.status),
    index("generated_posts_scheduled_idx").on(t.scheduledFor),
  ],
);

// -----------------------------
// carousels
// -----------------------------

export const carousels = pgTable(
  "carousels",
  {
    id: id(),
    growthRunId: uuid("growth_run_id")
      .notNull()
      .references(() => growthRuns.id, { onDelete: "cascade" }),
    generatedPostId: uuid("generated_post_id").references(
      () => generatedPosts.id,
      { onDelete: "set null" },
    ),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    template: text("template").notNull(),
    status: carouselStatusEnum("status").notNull().default("pending"),
    caption: text("caption"),
    storageFolder: text("storage_folder"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("carousels_run_idx").on(t.growthRunId),
    index("carousels_user_idx").on(t.userId),
  ],
);

// -----------------------------
// carousel_slides
// -----------------------------

export const carouselSlides = pgTable(
  "carousel_slides",
  {
    id: id(),
    carouselId: uuid("carousel_id")
      .notNull()
      .references(() => carousels.id, { onDelete: "cascade" }),
    slideNumber: integer("slide_number").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    visualPrompt: text("visual_prompt"),
    html: text("html"),
    imageStoragePath: text("image_storage_path"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("carousel_slides_carousel_n_uniq").on(
      t.carouselId,
      t.slideNumber,
    ),
  ],
);

// -----------------------------
// analytics_snapshots
// -----------------------------

export const analyticsSnapshots = pgTable(
  "analytics_snapshots",
  {
    id: id(),
    generatedPostId: uuid("generated_post_id")
      .notNull()
      .references(() => generatedPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    impressions: bigint("impressions", { mode: "number" }).notNull().default(0),
    likes: bigint("likes", { mode: "number" }).notNull().default(0),
    replies: bigint("replies", { mode: "number" }).notNull().default(0),
    reposts: bigint("reposts", { mode: "number" }).notNull().default(0),
    bookmarks: bigint("bookmarks", { mode: "number" }).notNull().default(0),
    engagementRate: doublePrecision("engagement_rate"),
    createdAt: createdAt(),
  },
  (t) => [
    index("analytics_snapshots_post_idx").on(t.generatedPostId),
    index("analytics_snapshots_user_idx").on(t.userId),
  ],
);

// -----------------------------
// learning_insights
// -----------------------------

export const learningInsights = pgTable(
  "learning_insights",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    insightType: text("insight_type").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    confidence: doublePrecision("confidence"),
    createdAt: createdAt(),
  },
  (t) => [index("learning_insights_user_idx").on(t.userId)],
);

// -----------------------------
// webhook_events
// -----------------------------

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: id(),
    source: text("source").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    signature: text("signature"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    status: text("status").notNull().default("received"),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("webhook_events_source_idx").on(t.source)],
);

// -----------------------------
// trace_events
// -----------------------------

export const traceEvents = pgTable(
  "trace_events",
  {
    id: id(),
    growthRunId: uuid("growth_run_id")
      .notNull()
      .references(() => growthRuns.id, { onDelete: "cascade" }),
    agentStepId: uuid("agent_step_id").references(() => agentSteps.id, {
      onDelete: "set null",
    }),
    level: traceLevelEnum("level").notNull().default("info"),
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("trace_events_run_idx").on(t.growthRunId),
    index("trace_events_step_idx").on(t.agentStepId),
    index("trace_events_ts_idx").on(t.ts),
  ],
);

// -----------------------------
// Re-exports for convenience
// -----------------------------

export const schema = {
  users,
  brandProfiles,
  xAccounts,
  growthRuns,
  agentSteps,
  toolCallLogs,
  researchSources,
  viralPatterns,
  contentIdeas,
  generatedPosts,
  carousels,
  carouselSlides,
  analyticsSnapshots,
  learningInsights,
  webhookEvents,
  traceEvents,
};

export type Schema = typeof schema;
