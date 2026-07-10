import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function checkSubscriptionAPI(request: NextRequest): Promise<{
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error("[API PROTECTION] Missing Supabase credentials");
      return {
        authorized: false,
        error: NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        ),
      };
    }

    // Create SSR client that reads cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[API PROTECTION] Not authenticated");
      return {
        authorized: false,
        error: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        ),
      };
    }

    console.log("[API PROTECTION] User authenticated:", user.email);

    try {
      // Check subscription status
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn(
          "[API PROTECTION] Profile fetch error:",
          profileError.message
        );
        // Fail closed: we can't confirm this user has a valid subscription,
        // so the safe default is to deny, not to let them through. A 503
        // (not 403) tells the client this is a transient verification
        // failure worth retrying, not "you need to subscribe".
        return {
          authorized: false,
          error: NextResponse.json(
            { error: "Couldn't verify your subscription. Please try again." },
            { status: 503 }
          ),
        };
      }

      if (!profile) {
        console.log("[API PROTECTION] No profile found");
        return {
          authorized: false,
          error: NextResponse.json(
            { error: "Subscription required" },
            { status: 403 }
          ),
        };
      }

      const subscriptionStatus = profile.subscription_status;
      const trialEndsAt = profile.trial_ends_at
        ? new Date(profile.trial_ends_at)
        : null;
      const now = new Date();

      console.log("[API PROTECTION] Subscription status:", subscriptionStatus);

      // Check if subscription is valid. An "active" status is valid on its own —
      // Stripe can leave trial_ends_at set to a past value even after the
      // subscription becomes active, so it must not gate the active case.
      const isActiveSubscription = subscriptionStatus === "active";

      const isValidTrial =
        subscriptionStatus === "trialing" && trialEndsAt && trialEndsAt > now;

      if (isActiveSubscription || isValidTrial) {
        console.log("[API PROTECTION] Valid subscription, allowing access");
        return { authorized: true, userId: user.id };
      }

      console.log("[API PROTECTION] No valid subscription");
      return {
        authorized: false,
        error: NextResponse.json(
          { error: "Subscription required" },
          { status: 403 }
        ),
      };
    } catch (dbError) {
      console.error("[API PROTECTION] Database error:", dbError);
      // Same fail-closed reasoning as the profileError branch above.
      return {
        authorized: false,
        error: NextResponse.json(
          { error: "Couldn't verify your subscription. Please try again." },
          { status: 503 }
        ),
      };
    }
  } catch (error) {
    console.error("[API PROTECTION] Unexpected error:", error);
    return {
      authorized: false,
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}
