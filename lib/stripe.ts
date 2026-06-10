import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-05-27.dahlia",
});

export const PLANS = {
  starter: {
    id: "starter",
    name: "Solo",
    price: 9,
    description: "Perfect for individuals",
    features: [
      "Up to 3 budgets",
      "Basic analytics",
      "1 user account",
      "Email support",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  },
  pro: {
    id: "pro",
    name: "Team",
    price: 25,
    description: "For teams and businesses",
    features: [
      "Unlimited budgets",
      "Advanced analytics",
      "Up to 10 user accounts",
      "Priority email support",
      "Custom categories",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For large organizations",
    features: [
      "Everything in Team",
      "Unlimited user accounts",
      "API access",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantee",
    ],
    stripePriceId: undefined,
    isContactOnly: true,
  },
};
