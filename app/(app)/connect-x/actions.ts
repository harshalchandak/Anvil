"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthUser } from "@/lib/auth";
import { setDemoXAccount } from "@/lib/demo-x-account";

function normaliseHandle(input: string): string {
  return input.trim().replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "");
}

export type ConnectDemoResult =
  | { ok: true }
  | { ok: false; error: string };

export async function connectXDemo(
  _prev: ConnectDemoResult | null,
  formData: FormData,
): Promise<ConnectDemoResult> {
  await requireAuthUser();

  const handle = normaliseHandle((formData.get("handle") as string) ?? "");
  if (!handle) {
    return {
      ok: false,
      error: "Type the @handle you want to connect as.",
    };
  }
  if (handle.length > 15) {
    return {
      ok: false,
      error: "X handles are 15 characters or fewer.",
    };
  }

  await setDemoXAccount({
    // Deterministic fake numeric id so the cookie shape mirrors the real
    // OAuth callback. Real id comes from X /2/users/me when wired.
    xUserId: `demo_${handle.toLowerCase()}`,
    xUsername: handle,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect(`/dashboard?x_connected=1&x_username=${encodeURIComponent(handle)}`);
}
