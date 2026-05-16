CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
CREATE TYPE "public"."approval_mode" AS ENUM('manual', 'autopilot');--> statement-breakpoint
CREATE TYPE "public"."post_format" AS ENUM('single', 'thread', 'carousel');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'needs_revision', 'approved', 'scheduled', 'publishing', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('pending', 'running', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('pending', 'running', 'completed', 'failed', 'retrying', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."trace_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
CREATE TABLE "agent_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"growth_run_id" uuid NOT NULL,
	"parent_step_id" uuid,
	"agent_name" text NOT NULL,
	"step_name" text NOT NULL,
	"status" "step_status" DEFAULT 'pending' NOT NULL,
	"input_json" jsonb,
	"output_json" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generated_post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"likes" bigint DEFAULT 0 NOT NULL,
	"replies" bigint DEFAULT 0 NOT NULL,
	"reposts" bigint DEFAULT 0 NOT NULL,
	"bookmarks" bigint DEFAULT 0 NOT NULL,
	"engagement_rate" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"niche" text NOT NULL,
	"audience" text NOT NULL,
	"goal" text NOT NULL,
	"tone" text NOT NULL,
	"frequency" text NOT NULL,
	"approval_mode" "approval_mode" DEFAULT 'manual' NOT NULL,
	"sample_style" text,
	"competitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"banned_words" text[] DEFAULT '{}'::text[] NOT NULL,
	"cta_preference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carousel_slides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carousel_id" uuid NOT NULL,
	"slide_number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"visual_prompt" text,
	"html" text,
	"image_storage_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carousels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"growth_run_id" uuid NOT NULL,
	"generated_post_id" uuid,
	"user_id" uuid NOT NULL,
	"template" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"caption" text,
	"storage_folder" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"growth_run_id" uuid NOT NULL,
	"angle" text NOT NULL,
	"format" "post_format" NOT NULL,
	"target_goal" text,
	"reasoning" text,
	"scheduled_for" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"growth_run_id" uuid NOT NULL,
	"content_idea_id" uuid,
	"user_id" uuid NOT NULL,
	"format" "post_format" NOT NULL,
	"text" text NOT NULL,
	"thread_json" jsonb,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"x_post_id" text,
	"scores_json" jsonb,
	"reasoning" text,
	"risk_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "growth_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand_profile_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"niche" text,
	"goal" text,
	"status" "run_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"summary" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"insight_type" text NOT NULL,
	"content" jsonb NOT NULL,
	"confidence" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"growth_run_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"snippet" text,
	"score" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_call_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_step_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"input_json" jsonb,
	"output_json" jsonb,
	"duration_ms" integer,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trace_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"growth_run_id" uuid NOT NULL,
	"agent_step_id" uuid,
	"level" "trace_level" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"email" text,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "viral_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"why_it_works" text NOT NULL,
	"example_structure" text,
	"when_to_use" text,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"cta_suggestion" text,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text,
	"processed_at" timestamp with time zone,
	"status" text DEFAULT 'received' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "x_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"x_user_id" text NOT NULL,
	"x_username" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"invalid" boolean DEFAULT false NOT NULL,
	"last_refresh_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_growth_run_id_growth_runs_id_fk" FOREIGN KEY ("growth_run_id") REFERENCES "public"."growth_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_parent_step_id_agent_steps_id_fk" FOREIGN KEY ("parent_step_id") REFERENCES "public"."agent_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_generated_post_id_generated_posts_id_fk" FOREIGN KEY ("generated_post_id") REFERENCES "public"."generated_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousel_slides" ADD CONSTRAINT "carousel_slides_carousel_id_carousels_id_fk" FOREIGN KEY ("carousel_id") REFERENCES "public"."carousels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousels" ADD CONSTRAINT "carousels_growth_run_id_growth_runs_id_fk" FOREIGN KEY ("growth_run_id") REFERENCES "public"."growth_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousels" ADD CONSTRAINT "carousels_generated_post_id_generated_posts_id_fk" FOREIGN KEY ("generated_post_id") REFERENCES "public"."generated_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carousels" ADD CONSTRAINT "carousels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_ideas" ADD CONSTRAINT "content_ideas_growth_run_id_growth_runs_id_fk" FOREIGN KEY ("growth_run_id") REFERENCES "public"."growth_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_posts" ADD CONSTRAINT "generated_posts_growth_run_id_growth_runs_id_fk" FOREIGN KEY ("growth_run_id") REFERENCES "public"."growth_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_posts" ADD CONSTRAINT "generated_posts_content_idea_id_content_ideas_id_fk" FOREIGN KEY ("content_idea_id") REFERENCES "public"."content_ideas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_posts" ADD CONSTRAINT "generated_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_runs" ADD CONSTRAINT "growth_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_runs" ADD CONSTRAINT "growth_runs_brand_profile_id_brand_profiles_id_fk" FOREIGN KEY ("brand_profile_id") REFERENCES "public"."brand_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_insights" ADD CONSTRAINT "learning_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_sources" ADD CONSTRAINT "research_sources_growth_run_id_growth_runs_id_fk" FOREIGN KEY ("growth_run_id") REFERENCES "public"."growth_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_call_logs" ADD CONSTRAINT "tool_call_logs_agent_step_id_agent_steps_id_fk" FOREIGN KEY ("agent_step_id") REFERENCES "public"."agent_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_events" ADD CONSTRAINT "trace_events_growth_run_id_growth_runs_id_fk" FOREIGN KEY ("growth_run_id") REFERENCES "public"."growth_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trace_events" ADD CONSTRAINT "trace_events_agent_step_id_agent_steps_id_fk" FOREIGN KEY ("agent_step_id") REFERENCES "public"."agent_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "x_accounts" ADD CONSTRAINT "x_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_steps_run_idx" ON "agent_steps" USING btree ("growth_run_id");--> statement-breakpoint
CREATE INDEX "agent_steps_parent_idx" ON "agent_steps" USING btree ("parent_step_id");--> statement-breakpoint
CREATE INDEX "analytics_snapshots_post_idx" ON "analytics_snapshots" USING btree ("generated_post_id");--> statement-breakpoint
CREATE INDEX "analytics_snapshots_user_idx" ON "analytics_snapshots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "brand_profiles_user_idx" ON "brand_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carousel_slides_carousel_n_uniq" ON "carousel_slides" USING btree ("carousel_id","slide_number");--> statement-breakpoint
CREATE INDEX "carousels_run_idx" ON "carousels" USING btree ("growth_run_id");--> statement-breakpoint
CREATE INDEX "carousels_user_idx" ON "carousels" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_ideas_run_idx" ON "content_ideas" USING btree ("growth_run_id");--> statement-breakpoint
CREATE INDEX "generated_posts_run_idx" ON "generated_posts" USING btree ("growth_run_id");--> statement-breakpoint
CREATE INDEX "generated_posts_user_idx" ON "generated_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generated_posts_status_idx" ON "generated_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "generated_posts_scheduled_idx" ON "generated_posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "growth_runs_user_idx" ON "growth_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "growth_runs_status_idx" ON "growth_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "learning_insights_user_idx" ON "learning_insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "research_sources_run_idx" ON "research_sources" USING btree ("growth_run_id");--> statement-breakpoint
CREATE INDEX "tool_call_logs_step_idx" ON "tool_call_logs" USING btree ("agent_step_id");--> statement-breakpoint
CREATE INDEX "trace_events_run_idx" ON "trace_events" USING btree ("growth_run_id");--> statement-breakpoint
CREATE INDEX "trace_events_step_idx" ON "trace_events" USING btree ("agent_step_id");--> statement-breakpoint
CREATE INDEX "trace_events_ts_idx" ON "trace_events" USING btree ("ts");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_user_id_uniq" ON "users" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "viral_patterns_name_uniq" ON "viral_patterns" USING btree ("name");--> statement-breakpoint
CREATE INDEX "webhook_events_source_idx" ON "webhook_events" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "x_accounts_user_uniq" ON "x_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "x_accounts_x_user_uniq" ON "x_accounts" USING btree ("x_user_id");