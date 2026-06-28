import { NextRequest, NextResponse } from "next/server";
import { createProxyClient } from "@/lib/supabase-proxy";

// /app is intentionally not matched here anymore — AppGuard
// (components/app/app-guard.tsx) handles login/onboarding/subscription
// gating client-side now, so it can show a friendly message instead of a
// silent server redirect. This middleware only still protects /onboarding,
// which has no client-side guard of its own.
export const config = {
  matcher: ["/onboarding"],
};

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log("🛡️ [PROXY] Protecting route:", pathname);

  try {
    const { supabase, response } = await createProxyClient(request);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log("❌ [PROXY] No session found, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.warn("⚠️ [PROXY] Error fetching profile:", profileError.message);
        return response;
      }

      if (!profile) {
        console.log("⚠️ [PROXY] No profile found for user, redirecting to /pricing");
        return NextResponse.redirect(new URL("/pricing", request.url));
      }

      if (profile.onboarding_completed) {
        console.log("✅ [PROXY] Onboarding already completed, redirecting to /app");
        return NextResponse.redirect(new URL("/app", request.url));
      }

      return response;
    } catch (dbError) {
      console.error("❌ [PROXY] Database error:", dbError);
      return response;
    }
  } catch (error) {
    console.error("❌ [PROXY] Proxy error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
