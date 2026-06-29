"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  User, Mail, Calendar, Database, HardDrive, MessageSquare,
  Zap, Users, Shield, LayoutGrid, Phone, Infinity, Plug,
  Headphones, BookOpen, Star, Brain, Eye, Copy, TrendingUp, Check, Share2
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import NumberFlow from "@number-flow/react";
import { usePostHog } from "posthog-js/react";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  disabled?: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

const getIconForFeature = (text: string) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("shared context across all team")) return { icon: Share2, color: "var(--color-info)" };
  if (lowerText.includes("1 user")) return { icon: User, color: "var(--color-error)" };
  if (lowerText.includes("users")) return { icon: Users, color: "var(--color-error)" };
  if (lowerText.includes("gmail") || lowerText.includes("email")) return { icon: Mail, color: "var(--color-warning)" };
  if (lowerText.includes("calendar")) return { icon: Calendar, color: "var(--color-info)" };
  if (lowerText.includes("notion")) return { icon: Database, color: "var(--color-category-idea-text)" };
  if (lowerText.includes("drive")) return { icon: HardDrive, color: "var(--color-info)" };
  if (lowerText.includes("ai context") || lowerText.includes("shared ai")) return { icon: Brain, color: "var(--color-accent)" };
  if (lowerText.includes("chat") && !lowerText.includes("ai")) return { icon: MessageSquare, color: "var(--color-info)" };
  if (lowerText.includes("dashboard") || lowerText.includes("visibility")) return { icon: Eye, color: "var(--color-info)" };
  if (lowerText.includes("ready") || lowerText.includes("minutes")) return { icon: Zap, color: "var(--color-warning)" };
  if (lowerText.includes("permissions") || lowerText.includes("roles") || lowerText.includes("security")) return { icon: Shield, color: "var(--color-warning)" };
  if (lowerText.includes("support")) return { icon: Headphones, color: "var(--color-info)" };
  if (lowerText.includes("unlimited")) return { icon: Infinity, color: "var(--color-accent)" };
  if (lowerText.includes("integration")) return { icon: Plug, color: "var(--color-warning)" };
  if (lowerText.includes("onboarding")) return { icon: BookOpen, color: "var(--color-info)" };
  if (lowerText.includes("everything")) return { icon: Check, color: "var(--color-success)" };
  if (lowerText.includes("scales")) return { icon: TrendingUp, color: "var(--color-accent)" };
  if (lowerText.includes("custom")) return { icon: Plug, color: "var(--color-accent)" };
  if (lowerText.includes("assign")) return { icon: Check, color: "var(--color-success)" };

  return { icon: Check, color: "var(--color-success)" };
};

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you.\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<HTMLButtonElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();
  const hasFiredPricingViewed = useRef(false);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFiredPricingViewed.current) {
          hasFiredPricingViewed.current = true;
          posthog?.capture('pricing_viewed');
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [posthog]);

  return (
    <section ref={sectionRef} className="py-20 md:py-24 px-4 md:px-6 bg-[var(--color-bg-base)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Get 6 hours back every week<br />
            for less than <span className="underline decoration-[var(--color-accent)] decoration-4 underline-offset-4">a coffee a day.</span>
          </h2>
          <p className="text-lg text-[var(--color-text-primary)] mt-4">
            7 day free trial. Cancel anytime.
          </p>
        </div>


        <div
          className={cn(
            "grid grid-cols-1 gap-6 mx-auto",
            plans.length === 2 ? "md:grid-cols-2 max-w-3xl" : "md:grid-cols-3"
          )}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
              }}
              className="relative"
            >
              {plan.isPopular && (
                <div className="absolute rounded-2xl bg-gradient-to-t from-[var(--color-accent)] 60% to-[var(--color-bg-base)] h-[70%] w-[105%] left-1/2 -translate-x-1/2 bottom-0 translate-y-2 z-0" />
              )}
              <div
                className={cn(
                  "rounded-2xl border border-[var(--color-border-default)] p-6 bg-[var(--color-bg-base)] flex flex-col relative z-10 min-h-[560px]",
                )}
              >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-accent)] py-1 px-4 rounded-full flex items-center gap-1">
                  <Star className="h-4 w-4 text-white fill-white" />
                  <span className="text-white text-sm font-semibold">
                    Popular
                  </span>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                <p className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
                  {plan.name}
                </p>

                <div className="mt-2 mb-8 flex items-baseline gap-1">
                  {plan.price === "Contact us" ? (
                    <span className="text-5xl font-bold text-[var(--color-text-primary)]">
                      Contact us
                    </span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-[var(--color-text-primary)]">
                        €{plan.price.split(".")[0]}
                      </span>
                      <span className="text-2xl font-medium text-[var(--color-text-muted)]">
                        .{plan.price.split(".")[1]} / month
                      </span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, idx) => {
                    const { icon: IconComponent, color } = getIconForFeature(feature);
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <IconComponent className="h-4 w-4 mt-1 flex-shrink-0" style={{ color }} />
                        <span className="text-base font-medium text-[var(--color-text-secondary)]">{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                {plan.disabled ? (
                  <button
                    type="button"
                    disabled
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        size: "lg",
                      }),
                      "w-full justify-center mt-auto opacity-50 cursor-not-allowed pointer-events-none",
                    )}
                  >
                    {plan.buttonText}
                  </button>
                ) : (
                  <Link
                    href={plan.href}
                    prefetch={false}
                    onClick={() => posthog?.capture('pricing_plan_clicked', { plan: plan.name.toLowerCase() })}
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        size: "lg",
                      }),
                      "w-full justify-center mt-auto",
                    )}
                  >
                    {plan.buttonText}
                  </Link>
                )}
              </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
