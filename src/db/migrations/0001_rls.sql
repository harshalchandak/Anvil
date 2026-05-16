-- Row Level Security: every user-scoped table is locked to the owning user.
-- Service-role connections (Inngest worker, drizzle-kit migrations) bypass RLS by design.
--
-- public.users.id is a separate UUID that mirrors Supabase auth.users via auth_user_id.
-- The helper below resolves the current request's app-user id from auth.uid().

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
$$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM public;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated, anon, service_role;--> statement-breakpoint

-- ------------------------------------------------------------
-- users: a row is only visible to the auth user it mirrors.
-- ------------------------------------------------------------
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "users_select_own" ON "users"
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "users_insert_own" ON "users"
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "users_delete_own" ON "users"
  FOR DELETE TO authenticated
  USING (auth_user_id = auth.uid());--> statement-breakpoint

-- ------------------------------------------------------------
-- brand_profiles
-- ------------------------------------------------------------
ALTER TABLE "brand_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "brand_profiles_owner_all" ON "brand_profiles"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- x_accounts
-- ------------------------------------------------------------
ALTER TABLE "x_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "x_accounts_owner_all" ON "x_accounts"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- growth_runs
-- ------------------------------------------------------------
ALTER TABLE "growth_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "growth_runs_owner_all" ON "growth_runs"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- agent_steps: scoped via parent growth_run
-- ------------------------------------------------------------
ALTER TABLE "agent_steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "agent_steps_owner_all" ON "agent_steps"
  FOR ALL TO authenticated
  USING (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  );--> statement-breakpoint

-- ------------------------------------------------------------
-- tool_call_logs: scoped via agent_step -> growth_run
-- ------------------------------------------------------------
ALTER TABLE "tool_call_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tool_call_logs_owner_all" ON "tool_call_logs"
  FOR ALL TO authenticated
  USING (
    agent_step_id IN (
      SELECT s.id FROM "agent_steps" s
      JOIN "growth_runs" r ON r.id = s.growth_run_id
      WHERE r.user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    agent_step_id IN (
      SELECT s.id FROM "agent_steps" s
      JOIN "growth_runs" r ON r.id = s.growth_run_id
      WHERE r.user_id = public.current_app_user_id()
    )
  );--> statement-breakpoint

-- ------------------------------------------------------------
-- research_sources: scoped via growth_run
-- ------------------------------------------------------------
ALTER TABLE "research_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "research_sources_owner_all" ON "research_sources"
  FOR ALL TO authenticated
  USING (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  );--> statement-breakpoint

-- ------------------------------------------------------------
-- viral_patterns: GLOBAL read-only. Service-role writes only.
-- ------------------------------------------------------------
ALTER TABLE "viral_patterns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "viral_patterns_read_all" ON "viral_patterns"
  FOR SELECT TO authenticated
  USING (true);--> statement-breakpoint

-- ------------------------------------------------------------
-- content_ideas: scoped via growth_run
-- ------------------------------------------------------------
ALTER TABLE "content_ideas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "content_ideas_owner_all" ON "content_ideas"
  FOR ALL TO authenticated
  USING (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  );--> statement-breakpoint

-- ------------------------------------------------------------
-- generated_posts
-- ------------------------------------------------------------
ALTER TABLE "generated_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "generated_posts_owner_all" ON "generated_posts"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- carousels
-- ------------------------------------------------------------
ALTER TABLE "carousels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "carousels_owner_all" ON "carousels"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- carousel_slides: scoped via carousel
-- ------------------------------------------------------------
ALTER TABLE "carousel_slides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "carousel_slides_owner_all" ON "carousel_slides"
  FOR ALL TO authenticated
  USING (
    carousel_id IN (
      SELECT id FROM "carousels" WHERE user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    carousel_id IN (
      SELECT id FROM "carousels" WHERE user_id = public.current_app_user_id()
    )
  );--> statement-breakpoint

-- ------------------------------------------------------------
-- analytics_snapshots
-- ------------------------------------------------------------
ALTER TABLE "analytics_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "analytics_snapshots_owner_all" ON "analytics_snapshots"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- learning_insights
-- ------------------------------------------------------------
ALTER TABLE "learning_insights" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "learning_insights_owner_all" ON "learning_insights"
  FOR ALL TO authenticated
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());--> statement-breakpoint

-- ------------------------------------------------------------
-- webhook_events: not user-scoped. Service-role only.
-- ------------------------------------------------------------
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ------------------------------------------------------------
-- trace_events: scoped via growth_run
-- ------------------------------------------------------------
ALTER TABLE "trace_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "trace_events_owner_read" ON "trace_events"
  FOR SELECT TO authenticated
  USING (
    growth_run_id IN (
      SELECT id FROM "growth_runs" WHERE user_id = public.current_app_user_id()
    )
  );--> statement-breakpoint
