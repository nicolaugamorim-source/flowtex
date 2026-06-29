import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Handles Stripe webhook events (checkout completed, subscription updated/cancelled, etc.)
// and syncs the resulting subscription state onto the user's profile.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Stripe's statuses use "canceled" (one L); the rest of this app already
// reads/writes "cancelled" (profiles.subscription_status, proxy.ts), so
// normalize here at the boundary instead of touching every call site.
function toProfileStatus(stripeStatus: Stripe.Subscription.Status): string {
  return stripeStatus === "canceled" ? "cancelled" : stripeStatus;
}

async function syncSubscriptionToProfile(subscription: Stripe.Subscription) {
  const supabaseAdmin = getSupabaseAdmin();
  const userId = subscription.metadata?.user_id;

  const update: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: toProfileStatus(subscription.status),
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  };

  // Mark the account's one trial as used as soon as a trialing subscription
  // is seen at all — this must not depend on being able to read the card's
  // fingerprint (enforceCardTrialLimit below), or a payment method that
  // isn't attached to the subscription yet would leave trial_used_at unset
  // forever, letting that account restart the trial on every resubscribe.
  if (subscription.status === "trialing") {
    update.trial_used_at = new Date().toISOString();
  }

  if (userId) {
    await supabaseAdmin.from("profiles").update(update).eq("id", userId);
  } else {
    await supabaseAdmin
      .from("profiles")
      .update(update)
      .eq("stripe_customer_id", subscription.customer as string);
  }
}

// Card-fingerprint trial abuse check: a fingerprint is stable per physical
// card across different Stripe customers, so this catches "new account, same
// card" abuse that an account-level flag can't. If the card already backed a
// trial elsewhere, end this trial immediately (charges now) instead of
// silently granting a second one.
async function enforceCardTrialLimit(subscription: Stripe.Subscription) {
  if (subscription.status !== "trialing") return;

  const stripe = getStripe();
  const userId = subscription.metadata?.user_id;
  const paymentMethodId =
    typeof subscription.default_payment_method === "string"
      ? subscription.default_payment_method
      : subscription.default_payment_method?.id;

  if (!paymentMethodId) return;

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const fingerprint = paymentMethod.card?.fingerprint;
  if (!fingerprint) return;

  const supabaseAdmin = getSupabaseAdmin();
  const { data: existing } = await supabaseAdmin
    .from("used_trial_cards")
    .select("user_id")
    .eq("card_fingerprint", fingerprint)
    .maybeSingle();

  if (existing && existing.user_id !== userId) {
    await stripe.subscriptions.update(subscription.id, { trial_end: "now" });
    return;
  }

  await supabaseAdmin
    .from("used_trial_cards")
    .upsert({ card_fingerprint: fingerprint, user_id: userId ?? null });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscriptionToProfile(subscription);
          await enforceCardTrialLimit(subscription);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(subscription);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
