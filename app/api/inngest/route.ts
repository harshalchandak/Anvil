import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { growthRunFn } from "@/inngest/functions/growth-run";
import {
  analyticsOnDemandFn,
  analyticsRefreshCron,
} from "@/inngest/functions/analytics";

// The signing key is read from process.env.INNGEST_SIGNING_KEY (or set on
// the client). See src/inngest/client.ts.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [growthRunFn, analyticsRefreshCron, analyticsOnDemandFn],
});
