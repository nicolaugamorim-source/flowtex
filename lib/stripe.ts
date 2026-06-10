import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-05-27.dahlia",
});

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 29,
    description: "Perfect for getting started",
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
    name: "Pro",
    price: 79,
    description: "For serious budgeting",
    features: [
      "Unlimited budgets",
      "Advanced analytics",
      "Up to 5 user accounts",
      "Priority email support",
      "Custom categories",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    description: "For teams and businesses",
    features: [
      "Everything in Pro",
      "Unlimited user accounts",
      "API access",
      "24/7 phone support",
      "Custom integrations",
      "Dedicated account manager",
    ],
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
  },
};
