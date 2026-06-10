"use client";

import { PricingCards } from "@/components/ui/pricing-cards";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in via Supabase session
    const checkAuth = async () => {
      try {
        const { data } = await fetch("/api/auth/check").then(r => r.json()).catch(() => ({ data: null }));
        setIsLoggedIn(!!data?.session);
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your budget needs
          </p>
        </div>

        <PricingCards isLoggedIn={isLoggedIn} />

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-gray-500">
            Need a custom plan? <a href="/contact" className="text-indigo-600 hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}
