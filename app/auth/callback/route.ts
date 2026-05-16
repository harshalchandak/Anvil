import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth";

/**
 * Supabase OAuth + email-confirm callback.
 *
 * Two arrival shapes:
 *  - PKCE / OAuth: `?code=...&next=/path`
 *  - Email confirm token hash: `?token_hash=...&type=signup&next=/path` (rare in our flow)
 *
 * In both cases we exchange for a session, ensure a public.users row exists,
 * then bounce to `next` (default /dashboard).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tokenType = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/dashboard";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
  } else if (tokenHash && tokenType) {
    const { error } = await supabase.auth.verifyOtp({
      type: tokenType as "signup" | "magiclink" | "recovery" | "invite" | "email_change",
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/login?error=Missing+auth+code", request.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=Session+exchange+failed", request.url),
    );
  }

  // Mirror the auth.users row into public.users (idempotent).
  await ensureAppUser(user);

  return NextResponse.redirect(new URL(next, request.url));
}
