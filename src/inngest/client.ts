import "server-only";
import { Inngest } from "inngest";
import { env } from "@/lib/env";

type GrowthRunStart = {
  name: "growth-run/start";
  data: { growthRunId: string };
};

type AnalyticsRefresh = {
  name: "analytics/refresh";
  data: { userId: string; daysBack?: number };
};

export const inngest = new Inngest({
  id: "netisize",
  eventKey: env.INNGEST_EVENT_KEY,
  signingKey: env.INNGEST_SIGNING_KEY,
});

export type GrowthRunStartEvent = GrowthRunStart;
export type AnalyticsRefreshEvent = AnalyticsRefresh;
