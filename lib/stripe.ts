import Stripe from "stripe";

// Lazy singleton (not created at module scope) so build-time page-data
// collection never evaluates this with a missing env var.
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

export const PLAN_PRICE_IDS: Record<string, string> = {
  solo: process.env.STRIPE_PRICE_ID_SOLO!,
};

export const TRIAL_PERIOD_DAYS = 7;
