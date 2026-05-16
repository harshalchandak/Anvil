"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { xAccounts } from "@/db/schema";
import { requireAppUser } from "@/lib/auth";
import { clearDemoXAccount } from "@/lib/demo-x-account";

export async function disconnectX() {
  const { appUser } = await requireAppUser();
  // Try to delete the real DB row; swallow if Postgres isn't configured.
  try {
    await db.delete(xAccounts).where(eq(xAccounts.userId, appUser.id));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[netisize] disconnectX DB delete failed (likely demo mode):",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  // Always clear the demo cookie too, so a user can disconnect a connection
  // that was saved either way.
  await clearDemoXAccount();
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
