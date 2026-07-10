import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getStripe, PLAN_PRICE_IDS, TRIAL_PERIOD_DAYS } from "@/lib/stripe";
import { getRequestIp, hashIp } from "@/lib/hash-ip";

// Creates a Stripe Checkout session for the selected plan and redirects the
// user to it. Handles trial eligibility (one trial per user, IP-limited) and
// reuses an existing Stripe customer if one is already on the profile.
export async function GET(request: NextRequest) {
  try {
    const plan = request.nextUrl.searchParams.get("plan");
    const priceId = plan ? PLAN_PRICE_IDS[plan] : null;

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, trial_used_at")
      .eq("id", user.id)
      .single();

    const stripe = getStripe();

    // Reuse the Stripe customer if we already created one for this user.
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Trial eligibility: never used one before, and this IP hasn't backed a
    // trial recently. The IP check only withholds the trial — it never blocks
    // the purchase itself, to avoid punishing shared/office networks.
    let trialEligible = !profile?.trial_used_at;

    if (trialEligible) {
      const ip = getRequestIp(request);

      if (ip) {
        const ipHash = hashIp(ip);
        const lookback = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentSignup } = await supabaseAdmin
          .from("trial_signups")
          .select("id")
          .eq("ip_hash", ipHash)
          .neq("user_id", user.id)
          .gte("created_at", lookback)
          .limit(1)
          .maybeSingle();

        if (recentSignup) {
          trialEligible = false;
        } else {
          await supabaseAdmin.from("trial_signups").insert({ ip_hash: ipHash, user_id: user.id });
        }
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const successUrl = trialEligible
      ? (() => {
          const trialEndsDate = new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10); // date-only (YYYY-MM-DD), matches trial_ends_at's date with no time component
          return `${appUrl}/success?trial=true&trial_ends=${trialEndsDate}`;
        })()
      : `${appUrl}/success?trial=false`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: trialEligible
        ? { trial_period_days: TRIAL_PERIOD_DAYS, metadata: { user_id: user.id } }
        : { metadata: { user_id: user.id } },
      success_url: successUrl,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    const redirectResponse = NextResponse.redirect(session.url);

    // Short-lived proof that this browser actually went through Stripe
    // Checkout, so proxy.ts's `?checkout=success` bypass can require this
    // cookie instead of trusting the query param alone (which anyone could
    // append to a URL). httpOnly + 5min expiry keeps the bypass window tight;
    // proxy.ts clears the cookie the moment it's consumed.
    redirectResponse.cookies.set("checkout_pending", crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 5 * 60,
    });

    return redirectResponse;
  } catch (error) {
    console.error("[STRIPE CHECKOUT] Error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
