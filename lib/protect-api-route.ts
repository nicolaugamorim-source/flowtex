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
        // Allow through on DB error to avoid blocking users
        return { authorized: true, userId: user.id };
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

      // Check if subscription is valid
      const isActiveSubscription =
        subscriptionStatus === "active" && trialEndsAt && trialEndsAt > now;

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
      // Allow through on DB errors
      return { authorized: true, userId: user.id };
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
