"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, isPlaceholderEnv } from "@/lib/env";
import {
  clearLocalSession,
  setLocalSession,
} from "@/lib/local-auth";
import { clearDemoXAccount } from "@/lib/demo-x-account";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export async function signInWithPassword(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const next = (formData.get("next") as string | null) || "/dashboard";

  // Demo mode: any credentials work, just sign a local cookie and go.
  if (isPlaceholderEnv()) {
    await setLocalSession(parsed.data.email);
    redirect(next);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: error.message };
  redirect(next);
}

export async function signUpWithPassword(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (isPlaceholderEnv()) {
    await setLocalSession(parsed.data.email);
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { ok: false, error: error.message };

  if (data.session) redirect("/dashboard");

  return {
    ok: false,
    error:
      "Check your inbox to confirm your email. Once confirmed, you'll be logged in automatically.",
  };
}

export async function signOut() {
  // Always clear demo X account cookie on sign-out — the X connection is tied
  // to the user's local session.
  await clearDemoXAccount();
  if (isPlaceholderEnv()) {
    await clearLocalSession();
    redirect("/login");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearLocalSession(); // belt-and-suspenders
  redirect("/login");
}
