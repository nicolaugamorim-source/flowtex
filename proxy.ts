import { NextRequest, NextResponse } from "next/server";
import { createProxyClient } from "@/lib/supabase-proxy";

export const config = {
  matcher: ["/app", "/app/:path*", "/onboarding"],
};

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  console.log("🛡️ [PROXY] Protecting route:", pathname);

  try {
    const { supabase, response } = await createProxyClient(request);

    // Get the current user's session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // If no session, redirect to login
    if (!session?.user) {
      console.log("❌ [PROXY] No session found, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("✅ [PROXY] Session found for user:", session.user.email);

    // Stripe redirects here the instant checkout completes, which can race
    // the webhook that syncs subscription_status to the profile (the
    // webhook is usually near-instant but isn't guaranteed to land before
    // this very first request). Trust this one redirect — it only happens
    // right after Stripe itself confirms the payment — and let the (by-then
    // synced) profile gate every subsequent navigation normally.
    if (request.nextUrl.searchParams.get("checkout") === "success") {
      console.log("✅ [PROXY] Post-checkout redirect, allowing through once");
      return response;
    }

    try {
      // Check user's subscription status and onboarding status
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at, plan, onboarding_completed")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.warn("⚠️ [PROXY] Error fetching profile:", profileError.message);
        // If DB query fails, allow through to avoid blocking users
        console.log("✅ [PROXY] Allowing access (DB error, assuming valid subscription)");
        return response;
      }

      if (!profile) {
        console.log("⚠️ [PROXY] No profile found for user, redirecting to /pricing");
        return NextResponse.redirect(new URL("/pricing", request.url));
      }

      // Handle onboarding flow
      const isOnboardingRoute = pathname === "/onboarding";
      const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");
      const onboardingCompleted = profile.onboarding_completed;

      console.log("📋 [PROXY] Onboarding status:", {
        onboardingCompleted,
        isOnboardingRoute,
        isAppRoute,
      });

      // If onboarding is completed and user is on /onboarding, redirect to /app
      if (onboardingCompleted && isOnboardingRoute) {
        console.log("✅ [PROXY] Onboarding already completed, redirecting to /app");
        return NextResponse.redirect(new URL("/app", request.url));
      }

      // If onboarding is not completed and user is on /app, redirect to /onboarding
      if (!onboardingCompleted && isAppRoute) {
        console.log("⚠️ [PROXY] Onboarding not completed, redirecting to /onboarding");
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }

      // If onboarding is not completed but user is on /onboarding, allow through
      if (!onboardingCompleted && isOnboardingRoute) {
        console.log("✅ [PROXY] Onboarding in progress, allowing access");
        return response;
      }

      const subscriptionStatus = profile.subscription_status;
      const trialEndsAt = profile.trial_ends_at
        ? new Date(profile.trial_ends_at)
        : null;
      const now = new Date();

      console.log("📊 [PROXY] Profile data:", {
        subscriptionStatus,
        trialEndsAt: trialEndsAt?.toISOString(),
        plan: profile.plan,
        isExpired: trialEndsAt && trialEndsAt <= now,
      });

      // Check if subscription is active or valid trial
      const isActiveSubscription =
        subscriptionStatus === "active" && trialEndsAt && trialEndsAt > now;

      const isValidTrial =
        subscriptionStatus === "trialing" &&
        trialEndsAt &&
        trialEndsAt > now;

      if (isActiveSubscription || isValidTrial) {
        console.log("✅ [PROXY] Valid subscription/trial, allowing access");
        return response;
      }

      // Check if subscription is expired or invalid
      if (subscriptionStatus === null && !profile.plan) {
        console.log("⚠️ [PROXY] No subscription status or plan, redirecting to /pricing");
        return NextResponse.redirect(new URL("/pricing", request.url));
      }

      if (subscriptionStatus === "cancelled" || subscriptionStatus === "past_due" || subscriptionStatus === "paused") {
        console.log(`⚠️ [PROXY] Subscription status is ${subscriptionStatus}, redirecting to /pricing`);
        return NextResponse.redirect(new URL("/pricing", request.url));
      }

      if (trialEndsAt && trialEndsAt <= now) {
        console.log("⚠️ [PROXY] Trial expired, redirecting to /pricing");
        return NextResponse.redirect(new URL("/pricing", request.url));
      }

      // Default: redirect to pricing if no valid subscription found
      console.log("⚠️ [PROXY] No valid subscription, redirecting to /pricing");
      return NextResponse.redirect(new URL("/pricing", request.url));
    } catch (dbError) {
      console.error("❌ [PROXY] Database error:", dbError);
      // Allow through on DB errors to avoid blocking users
      console.log("✅ [PROXY] Allowing access (exception, assuming valid subscription)");
      return response;
    }
  } catch (error) {
    console.error("❌ [PROXY] Proxy error:", error);
    // On critical errors, redirect to login for safety
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
