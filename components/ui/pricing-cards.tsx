"use client";

import { Check } from "lucide-react";
import Link from "next/link";

interface PricingCardsProps {
  isLoggedIn?: boolean;
}

const PLANS = {
  solo: {
    id: "solo",
    name: "Solo",
    price: 29,
    description: "Perfect for individuals",
    features: [
      "1 user",
      "Up to 10 integrations",
      "Shared AI context",
      "One chat to manage projects, clients, and meetings",
      "Project & client dashboard",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 49,
    description: "For teams and businesses",
    features: [
      "Everything in Solo",
      "Up to 5 users",
      "Shared context across all team members",
      "Per-member permissions & roles",
      "10+ integrations",
      "Real-time project visibility for the whole team",
    ],
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    description: "For large organizations",
    features: [
      "Everything in Team",
      "Scales beyond 5 people",
      "Custom integrations on request",
      "Dedicated support",
      "Custom onboarding",
    ],
    isContactOnly: true,
  },
};

export function PricingCards({ isLoggedIn = false }: PricingCardsProps) {
  const handleSubscribe = (planId: string) => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/pricing?plan=${planId}`;
      window.location.href = `/login?from=${encodeURIComponent(returnUrl)}`;
    } else {
      // For logged-in users, start Stripe checkout
      window.location.href = `/api/stripe/checkout?plan=${planId}`;
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {Object.values(PLANS).map((plan) => {
        const isPopular = 'popular' in plan && plan.popular;
        const isContactOnly = 'isContactOnly' in plan && plan.isContactOnly;
        return (
        <div
          key={plan.id}
          className={`relative rounded-lg border-2 p-8 transition-all ${
            isPopular
              ? "scale-105 shadow-lg"
              : ""
          }`}
          style={{
            borderColor: isPopular ? "var(--color-accent)" : "var(--color-border)",
            backgroundColor: isPopular ? "var(--color-accent-bg)" : "var(--color-surface)",
          }}
        >
          {isPopular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-accent)" }}>
              Most Popular
            </div>
          )}

          <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
            {plan.name}
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>{plan.description}</p>

          <div className="mb-6">
            {isContactOnly ? (
              <div className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                Custom pricing
              </div>
            ) : (
              <>
                <span className="text-4xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  ${plan.price}
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>/month</span>
              </>
            )}
          </div>

          {isContactOnly ? (
            <Link
              href="/contact"
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all mb-8 block text-center"
              style={isPopular
                ? { backgroundColor: "var(--color-accent)", color: "white" }
                : { backgroundColor: "var(--color-surface-2)", color: "var(--color-text-primary)" }}
            >
              Contact Sales
            </Link>
          ) : (
            <button
              onClick={() => handleSubscribe(plan.id)}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all mb-8"
              style={isPopular
                ? { backgroundColor: "var(--color-accent)", color: "white" }
                : { backgroundColor: "var(--color-surface-2)", color: "var(--color-text-primary)" }}
            >
              {!isLoggedIn
                ? "Sign up to get started"
                : "Subscribe now"}
            </button>
          )}

          <ul className="space-y-4">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        );
      })}
    </div>
  );
}
