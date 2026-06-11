"use client";

import { Check } from "lucide-react";
import Link from "next/link";

interface PricingCardsProps {
  isLoggedIn?: boolean;
}

const PLANS = {
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
    isContactOnly: true,
  },
};

export function PricingCards({ isLoggedIn = false }: PricingCardsProps) {
  const handleSubscribe = () => {
    if (!isLoggedIn) {
      window.location.href = "/login";
    } else {
      window.location.href = "/contact";
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
              ? "border-indigo-600 bg-indigo-50/50 scale-105 shadow-lg"
              : "border-gray-200 bg-white"
          }`}
        >
          {isPopular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
          )}

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.name}
          </h3>
          <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

          <div className="mb-6">
            {isContactOnly ? (
              <div className="text-3xl font-bold text-gray-900">
                Custom pricing
              </div>
            ) : (
              <>
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/month</span>
              </>
            )}
          </div>

          {isContactOnly ? (
            <Link
              href="/contact"
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all mb-8 block text-center ${
                isPopular
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              Contact Sales
            </Link>
          ) : (
            <button
              onClick={handleSubscribe}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all mb-8 ${
                isPopular
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {!isLoggedIn
                ? "Sign up to get started"
                : "Get started"}
            </button>
          )}

          <ul className="space-y-4">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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
