import { NextRequest, NextResponse } from "next/server";
import { createProxyClient } from "@/lib/supabase-proxy";

// Server-side gate for /app and /onboarding. components/app/app-guard.tsx is
// the second layer (client-side) — kept intentionally, this just removes the
// brief window where /app's real content could render before that JS runs.
export const config = {
  matcher: ["/app", "/app/:path*", "/onboarding"],
};

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
  const isOnboardingRoute = pathname === "/onboarding";

  console.log("🛡️ [PROXY] Protecting route:", pathname);

  try {
    // Cookie-bound client (anon key + the user's own session cookies via SSR)
    // — this is what makes the query below run as that authenticated user,
    // never an anonymous/service-role lookup.
    const { supabase, response } = await createProxyClient(request);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log("❌ [PROXY] No session found, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Stripe's success redirect can land on /app before its webhook has
    // finished syncing subscription_status — trust this one-time param
    // (it only appears right after Stripe itself confirms payment) instead
    // of bouncing a paying user back to /pricing on this one request.
    if (isAppRoute && request.nextUrl.searchParams.get("checkout") === "success") {
      console.log("✅ [PROXY] Post-checkout redirect, allowing through once");
      return response;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed, subscription_status, trial_ends_at")
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

      // Onboarding gate — applies to both /app and /onboarding.
      if (!profile.onboarding_completed) {
        if (isAppRoute) {
          console.log("⚠️ [PROXY] Onboarding not completed, redirecting to /onboarding");
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        console.log("✅ [PROXY] Onboarding in progress, allowing access");
        return response;
      }

      // Onboarding already done and still on /onboarding → go to /app
      // (the app-side checks below will redirect further if needed).
      if (isOnboardingRoute) {
        console.log("✅ [PROXY] Onboarding already completed, redirecting to /app");
        return NextResponse.redirect(new URL("/app", request.url));
      }

      const subscriptionStatus = profile.subscription_status;
      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const now = new Date();

      if (subscriptionStatus === "active") {
        console.log("✅ [PROXY] Active subscription, allowing access");
        return response;
      }

      if (subscriptionStatus === "trialing" && trialEndsAt && trialEndsAt > now) {
        console.log("✅ [PROXY] Valid trial, allowing access");
        return response;
      }

      if (subscriptionStatus === "trialing" && trialEndsAt && trialEndsAt <= now) {
        console.log("⚠️ [PROXY] Trial expired, redirecting to /expired");
        return NextResponse.redirect(new URL("/expired", request.url));
      }

      console.log("⚠️ [PROXY] No valid subscription, redirecting to /pricing");
      return NextResponse.redirect(new URL("/pricing", request.url));
    } catch (dbError) {
      console.error("❌ [PROXY] Database error:", dbError);
      return response;
    }
  } catch (error) {
    console.error("❌ [PROXY] Proxy error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
