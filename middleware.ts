import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isPlaceholderEnv } from "@/lib/env";

/**
 * Routes that are accessible only to authenticated users. Matches the
 * Next.js `(app)` route group: dashboard, brand, runs, calendar, traces,
 * settings, posts, carousels.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/brand",
  "/runs",
  "/calendar",
  "/traces",
  "/settings",
  "/posts",
  "/carousels",
];

const LOCAL_COOKIE = "netisize_local_session";

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  // Demo mode: don't touch Supabase. Just check our local session cookie.
  if (isPlaceholderEnv()) {
    const hasLocal = Boolean(request.cookies.get(LOCAL_COOKIE)?.value);
    if (isProtectedPath(request.nextUrl.pathname) && !hasLocal) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  const { response, user } = await updateSupabaseSession(request);

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
