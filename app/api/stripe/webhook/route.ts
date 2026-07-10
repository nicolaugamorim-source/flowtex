import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { captureServerEvent } from "@/lib/posthog-server";
import { sendProductEmail } from "@/lib/emails/send";
import { createNotification } from "@/lib/notifications";
import {
  paymentFailedEmail,
  paymentSucceededEmail,
  trialEndingEmail,
  trialStartedEmail,
  accountActivatedEmail,
  cancellationScheduledEmail,
  subscriptionEndedEmail,
} from "@/lib/emails/templates";

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

// Resolves the app's user id for a Stripe subscription, falling back to a
// profile lookup by customer id when the metadata wasn't set (e.g. subscriptions
// created before this field existed, or created directly in the Stripe dashboard).
async function resolveUserId(subscription: Stripe.Subscription): Promise<string | undefined> {
  if (subscription.metadata?.user_id) return subscription.metadata.user_id;

  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", subscription.customer as string)
    .maybeSingle();

  return data?.id;
}

// Looks up the name/email to put in a product email by Stripe customer id —
// used by the invoice-based events below, which don't carry a subscription object.
async function resolveCustomerProfile(
  customerId: string
): Promise<{ id: string; email: string; full_name: string | null } | undefined> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data ?? undefined;
}

// Same as resolveCustomerProfile but keyed by the app's own user id — used by
// the subscription-object events below, which already resolved a userId.
async function resolveProfileById(
  userId: string
): Promise<{ email: string; full_name: string | null } | undefined> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .maybeSingle();

  return data ?? undefined;
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

  // Idempotency guard: Stripe retries delivery on any non-2xx response or
  // timeout, and several handlers below send emails/notifications, so a
  // replayed event must not re-run side effects. A unique-constraint
  // violation means this event id was already processed. The row is only
  // inserted *after* all side effects below complete successfully (see end
  // of try block) — if a handler throws partway through, no row is inserted,
  // so Stripe's retry will reprocess the event instead of a half-applied
  // event being silently skipped forever.
  const supabaseAdmin = getSupabaseAdmin();
  const { data: alreadyProcessed } = await supabaseAdmin
    .from("processed_stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    console.log(`[STRIPE WEBHOOK] Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
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

          const userId = await resolveUserId(subscription);
          if (userId) {
            const plan = subscription.items.data[0]?.price?.id;
            await captureServerEvent(userId, "checkout_completed", {
              plan,
              status: subscription.status,
              trial: subscription.status === "trialing",
            });
            if (subscription.status === "trialing") {
              await captureServerEvent(userId, "trial_started", { plan });
              const profile = await resolveProfileById(userId);
              if (profile?.email && subscription.trial_end) {
                const trialEndDate = new Date(subscription.trial_end * 1000).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
                await sendProductEmail(profile.email, trialStartedEmail(profile.full_name || "", trialEndDate));
              }
            } else {
              await captureServerEvent(userId, "subscription_started", { plan });
              const profile = await resolveProfileById(userId);
              if (profile?.email) {
                await sendProductEmail(profile.email, accountActivatedEmail(profile.full_name || ""));
              }
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(subscription);

        const userId = await resolveUserId(subscription);
        if (userId) {
          const plan = subscription.items.data[0]?.price?.id;
          if (subscription.cancel_at_period_end) {
            await captureServerEvent(userId, "subscription_cancel_scheduled", { plan });

            // Stripe can fire `updated` again while cancel_at_period_end stays
            // true (e.g. an unrelated metadata change) — only email the first
            // time it actually flips, or every such update would re-send this.
            const previousAttributes = (event.data as { previous_attributes?: Partial<Stripe.Subscription> }).previous_attributes;
            const justScheduled =
              event.type === "customer.subscription.updated" &&
              previousAttributes?.cancel_at_period_end === false;

            // Stripe API 2024+ moved current_period_end from the subscription
            // itself onto each subscription item.
            const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
            if (justScheduled && currentPeriodEnd) {
              const profile = await resolveProfileById(userId);
              const accessUntil = new Date(currentPeriodEnd * 1000).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
              if (profile?.email) {
                await sendProductEmail(profile.email, cancellationScheduledEmail(profile.full_name || "", accessUntil));
              }
              await createNotification(
                userId,
                "cancellation_scheduled",
                "Subscription set to cancel",
                `Your subscription is scheduled to end on ${accessUntil}. You'll keep access until then.`,
                { accessUntil }
              );
            }
          } else if (event.type === "customer.subscription.updated") {
            await captureServerEvent(userId, "subscription_updated", {
              plan,
              status: subscription.status,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscriptionToProfile(subscription);

        const userId = await resolveUserId(subscription);
        if (userId) {
          await captureServerEvent(userId, "subscription_canceled", {
            plan: subscription.items.data[0]?.price?.id,
          });
          const profile = await resolveProfileById(userId);
          if (profile?.email) {
            await sendProductEmail(profile.email, subscriptionEndedEmail(profile.full_name || ""));
          }
          await createNotification(
            userId,
            "subscription_canceled",
            "Subscription ended",
            "Your subscription has ended. Resubscribe any time to regain access.",
            {}
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const profile = await resolveCustomerProfile(invoice.customer as string);
        if (profile) {
          await captureServerEvent(profile.id, "payment_failed", {
            amount_due: invoice.amount_due,
            currency: invoice.currency,
          });
          if (profile.email) {
            await sendProductEmail(profile.email, paymentFailedEmail(profile.full_name || ""));
          }
          await createNotification(
            profile.id,
            "payment_failed",
            "Payment failed",
            "We couldn't process your last payment. Update your billing details to avoid losing access.",
            { amount_due: invoice.amount_due, currency: invoice.currency }
          );
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Every invoice fires this, including $0 trial-start invoices — only
        // email for an actual charge, so trial users don't get a confusing
        // "payment received" message.
        if (invoice.amount_paid > 0) {
          const profile = await resolveCustomerProfile(invoice.customer as string);
          if (profile?.email) {
            await captureServerEvent(profile.id, "payment_succeeded", {
              amount_paid: invoice.amount_paid,
              currency: invoice.currency,
            });

            // The very first invoice of a subscription created without a trial
            // fires this in the same beat as checkout.session.completed, which
            // already sends accountActivatedEmail — skip the duplicate here and
            // only email for renewals (billing_reason "subscription_cycle").
            if (invoice.billing_reason !== "subscription_create") {
              const amount = (invoice.amount_paid / 100).toLocaleString("en-US", {
                style: "currency",
                currency: invoice.currency.toUpperCase(),
              });
              await sendProductEmail(profile.email, paymentSucceededEmail(profile.full_name || "", amount));
            }
          }
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(subscription);
        if (userId) {
          const supabaseAdmin = getSupabaseAdmin();
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email, full_name")
            .eq("id", userId)
            .maybeSingle();

          await captureServerEvent(userId, "trial_ending_soon", {});

          if (subscription.trial_end) {
            const daysLeft = Math.max(
              1,
              Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
            );
            if (profile?.email) {
              await sendProductEmail(profile.email, trialEndingEmail(profile.full_name || "", daysLeft));
            }
            await createNotification(
              userId,
              "trial_ending",
              "Trial ending soon",
              `Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Add a payment method to keep your access.`,
              { daysLeft }
            );
          }
        }
        break;
      }

      default:
        break;
    }

    // All side effects for this event completed successfully — now it's
    // safe to mark it processed so a Stripe retry (or a genuine duplicate
    // delivery) is skipped. A 23505 here just means a concurrent delivery
    // of the same event won the race and already recorded it; that's fine.
    const { error: idempotencyError } = await supabaseAdmin
      .from("processed_stripe_events")
      .insert({ event_id: event.id });

    if (idempotencyError && idempotencyError.code !== "23505") {
      console.error("[STRIPE WEBHOOK] Failed to record event idempotency key:", idempotencyError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
