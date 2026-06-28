import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getStripe, PLAN_PRICE_IDS, TRIAL_PERIOD_DAYS } from "@/lib/stripe";
import { getRequestIp, hashIp } from "@/lib/hash-ip";

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

    console.log('[TRIAL] profile:', JSON.stringify(profile))

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

    console.log('[TRIAL] eligible after profile check:', trialEligible)

    if (trialEligible) {
      const ip = getRequestIp(request);

      console.log('[TRIAL] ip:', ip)

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

        console.log('[TRIAL] recentSignup:', JSON.stringify(recentSignup))

        if (recentSignup) {
          trialEligible = false;
        } else {
          await supabaseAdmin.from("trial_signups").insert({ ip_hash: ipHash, user_id: user.id });
        }
      }
    }

    console.log('[TRIAL] final eligible:', trialEligible)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: trialEligible
        ? { trial_period_days: TRIAL_PERIOD_DAYS, metadata: { user_id: user.id } }
        : { metadata: { user_id: user.id } },
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("❌ [STRIPE CHECKOUT] Error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
