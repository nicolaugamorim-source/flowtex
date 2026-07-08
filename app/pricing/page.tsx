"use client";

// Pricing page — shows plans and kicks off Stripe checkout for logged-in users.
import { Pricing } from "@/components/landing/pricing";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PricingInfo {
  hasActiveSubscription: boolean;
  subscriptionStatus?: string;
  planName?: string;
  subscriptionExpiresAt?: string;
}

const pricingPlans = [
  {
    name: "Solo",
    price: "29.99",
    yearlyPrice: "29.99",
    period: "/month",
    features: [
      "1 user",
      "Up to 10 integrations",
      "Shared AI context",
      "One chat to manage projects, clients, and meetings",
      "Project & client dashboard",
    ],
    description: "",
    buttonText: "Get started",
    href: "/api/stripe/checkout?plan=solo",
    isPopular: false,
  },
  {
    name: "Team",
    price: "49.99",
    yearlyPrice: "49.99",
    period: "/month",
    features: [
      "Everything in Solo",
      "Up to 5 users",
      "Shared context across all team members",
      "Per-member permissions & roles",
      "10+ integrations",
      "Real-time project visibility for the whole team",
    ],
    description: "",
    buttonText: "In development",
    href: "/api/stripe/checkout?plan=team",
    isPopular: true,
    disabled: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    yearlyPrice: "Contact us",
    period: "",
    features: [
      "Everything in Team",
      "Scales beyond 5 people",
      "Custom integrations on request",
      "Dedicated support",
      "Custom onboarding",
    ],
    description: "",
    buttonText: "In development",
    href: "/contact",
    isPopular: false,
    disabled: true,
  },
];

// Pricing page for logged-in (or logging-in) users — shows plans and current
// subscription status, with checkout links per plan.
export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo>({
    hasActiveSubscription: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and get their subscription status
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const { data } = await response.json();

        if (data?.session) {
          setIsLoggedIn(true);

          // Get subscription info
          try {
            const profileResponse = await fetch("/api/user/profile");
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();

              if (profileData.profile) {
                const { subscription_status, trial_ends_at, plan } = profileData.profile;
                const now = new Date();
                const trialEndsAt = trial_ends_at ? new Date(trial_ends_at) : null;

                const isActive =
                  (subscription_status === "active" || subscription_status === "trialing") &&
                  !!trialEndsAt &&
                  trialEndsAt > now;

                setPricingInfo({
                  hasActiveSubscription: isActive || false,
                  subscriptionStatus: subscription_status,
                  planName: plan,
                  subscriptionExpiresAt: trial_ends_at,
                });
              }
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--color-bg-base)] flex flex-col overflow-hidden">
      {/* Header with back button */}
      <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            {isLoggedIn && pricingInfo.hasActiveSubscription && (
              <div className="p-3 bg-[var(--color-success-bg)] border-2 border-[var(--color-success)] rounded-lg inline-block">
                <p className="text-[var(--color-success)] text-sm">
                  ✅ Active{" "}
                  <span className="font-semibold">
                    {pricingInfo.planName || "subscription"}
                  </span>
                  {pricingInfo.subscriptionExpiresAt && (
                    <span>
                      {" "}
                      until{" "}
                      {new Date(pricingInfo.subscriptionExpiresAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {isLoggedIn && pricingInfo.hasActiveSubscription && (
            <Link href="/app">
              <Button
                variant="outline"
                className="border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-bg)] h-9"
              >
                Back to App
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Pricing section - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Pricing plans={pricingPlans} />
      </div>
    </div>
  );
}
