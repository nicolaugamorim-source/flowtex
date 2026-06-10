"use client";

import { useState } from "react";
import { PLANS } from "@/lib/stripe";
import { Check } from "lucide-react";

interface PricingCardsProps {
  isLoggedIn?: boolean;
}

export function PricingCards({ isLoggedIn = false }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();
      if (data.sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {Object.values(PLANS).map((plan) => {
        const isPopular = 'popular' in plan && plan.popular;
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
            <span className="text-4xl font-bold text-gray-900">
              ${plan.price}
            </span>
            <span className="text-gray-600">/month</span>
          </div>

          <button
            onClick={() => handleCheckout(plan.id)}
            disabled={loading === plan.id || !isLoggedIn}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all mb-8 ${
              isPopular
                ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50"
            }`}
          >
            {loading === plan.id
              ? "Loading..."
              : !isLoggedIn
              ? "Sign up to subscribe"
              : "Subscribe Now"}
          </button>

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
