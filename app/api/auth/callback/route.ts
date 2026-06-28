import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/posthog-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  console.log("🔐 [AUTH CALLBACK] Starting OAuth callback...");
  console.log("📋 [AUTH CALLBACK] Code received:", code ? "YES" : "NO");
  console.log("📍 [AUTH CALLBACK] Site URL:", siteUrl);

  if (!code) {
    console.error("❌ [AUTH CALLBACK] No code in callback");
    return NextResponse.redirect(`${siteUrl}/login?error=no_code`);
  }

  try {
    const cookieStore = await cookies();

    console.log("📝 [AUTH CALLBACK] Creating Supabase SSR client...");

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = cookieStore.getAll();
            console.log("🍪 [AUTH CALLBACK] Reading cookies:", allCookies.map((c) => c.name).join(", "));
            return allCookies;
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log("🍪 [AUTH CALLBACK] Setting cookie:", name);
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    console.log("🔄 [AUTH CALLBACK] Exchanging code for session...");

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("❌ [AUTH CALLBACK] Session exchange error:", error);
      return NextResponse.redirect(`${siteUrl}/login?error=auth_failed`);
    }

    if (!data.user) {
      console.error("❌ [AUTH CALLBACK] No user in session data");
      return NextResponse.redirect(`${siteUrl}/login?error=no_user`);
    }

    const user = data.user;

    console.log("✅ [AUTH CALLBACK] Session exchanged successfully");
    console.log("👤 [AUTH CALLBACK] User authenticated:", user.email);

    // Determine if this is a brand new user (no profile row yet) before we upsert one.
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    const isNewUser = !existingProfile;

    // Save Google tokens to integrations table
    console.log("📝 [AUTH CALLBACK] Saving Google tokens to integrations...");

    const providerToken = data.session?.provider_token;
    const providerRefreshToken = data.session?.provider_refresh_token;

    if (providerToken) {
      const { error: integrationError } = await supabase.from("integrations").upsert(
        {
          user_id: user.id,
          provider: "google",
          provider_account_id: user.user_metadata?.sub,
          provider_account_email: user.email,
          access_token: providerToken,
          refresh_token: providerRefreshToken ?? null,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          scope:
            "email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

      if (integrationError) {
        console.warn("⚠️ [AUTH CALLBACK] Integration save warning:", integrationError);
      } else {
        console.log("✅ [AUTH CALLBACK] Google tokens saved to integrations");
        await captureServerEvent(user.id, "integration_connected", { integration: "google" });
      }
    } else {
      console.warn("⚠️ [AUTH CALLBACK] No provider token found in session");
    }

    // Create profile if doesn't exist
    console.log("📝 [AUTH CALLBACK] Creating/updating profile...");

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? "",
          avatar_url: user.user_metadata?.avatar_url ?? "",
          // No free-trial grant here — the only trial is the 7-day Stripe
          // trial started from /pricing checkout. Until they check out,
          // subscription_status stays null and proxy.ts sends them to /pricing.
          onboarding_completed: false,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (profileError) {
      console.warn("⚠️ [AUTH CALLBACK] Profile upsert warning:", profileError);
    } else {
      console.log("✅ [AUTH CALLBACK] Profile created/updated");
    }

    await captureServerEvent(user.id, isNewUser ? "user_signed_up" : "user_logged_in", {
      email: user.email,
    });

    // Create ai_context if doesn't exist
    console.log("📝 [AUTH CALLBACK] Creating AI context...");

    const { error: aiError } = await supabase.from("ai_context").upsert(
      { user_id: user.id },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

    if (aiError) {
      console.warn("⚠️ [AUTH CALLBACK] AI context warning:", aiError);
    } else {
      console.log("✅ [AUTH CALLBACK] AI context created");
    }

    // Check profile for redirect
    console.log("🔍 [AUTH CALLBACK] Checking profile for redirect...");

    const { data: profile, error: profileError2 } = await supabase
      .from("profiles")
      .select("onboarding_completed, subscription_status, trial_ends_at")
      .eq("id", user.id)
      .single();

    if (profileError2) {
      console.warn("⚠️ [AUTH CALLBACK] Profile fetch warning:", profileError2);
    }

    // Onboarding comes first, unconditionally — a brand new user has no
    // subscription yet, and checking subscription before onboarding would
    // send them straight to /pricing without ever collecting their data.
    if (!profile?.onboarding_completed) {
      console.log("🔄 [AUTH CALLBACK] Redirecting to /onboarding");
      return NextResponse.redirect(`${siteUrl}/onboarding`);
    }

    if (profile.subscription_status === "active") {
      console.log("🔄 [AUTH CALLBACK] Redirecting to /app");
      return NextResponse.redirect(`${siteUrl}/app`);
    }

    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    if (profile.subscription_status === "trialing" && trialEndsAt && trialEndsAt > new Date()) {
      console.log("🔄 [AUTH CALLBACK] Redirecting to /app");
      return NextResponse.redirect(`${siteUrl}/app`);
    }

    if (profile.subscription_status === "trialing" && trialEndsAt && trialEndsAt <= new Date()) {
      console.log("🔄 [AUTH CALLBACK] Trial expired, redirecting to /expired");
      return NextResponse.redirect(`${siteUrl}/expired`);
    }

    console.log("🔄 [AUTH CALLBACK] Redirecting to /pricing");
    return NextResponse.redirect(`${siteUrl}/pricing`);
  } catch (error) {
    console.error("❌ [AUTH CALLBACK] Error:", error);
    console.error("❌ [AUTH CALLBACK] Details:", error instanceof Error ? error.message : error);
    return NextResponse.redirect(`${siteUrl}/login?error=callback_error`);
  }
}
