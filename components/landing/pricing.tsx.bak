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
import { useState, useRef } from "react";
import NumberFlow from "@number-flow/react";

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
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

const getIconForFeature = (text: string) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("shared context across all team")) return { icon: Share2, color: "#3B82F6" };
  if (lowerText.includes("1 user")) return { icon: User, color: "#EF4444" };
  if (lowerText.includes("users")) return { icon: Users, color: "#EF4444" };
  if (lowerText.includes("gmail") || lowerText.includes("email")) return { icon: Mail, color: "#FBBF24" };
  if (lowerText.includes("calendar")) return { icon: Calendar, color: "#3B82F6" };
  if (lowerText.includes("notion")) return { icon: Database, color: "#A855F7" };
  if (lowerText.includes("drive")) return { icon: HardDrive, color: "#8B5CF6" };
  if (lowerText.includes("ai context") || lowerText.includes("shared ai")) return { icon: Brain, color: "#06B6D4" };
  if (lowerText.includes("chat") && !lowerText.includes("ai")) return { icon: MessageSquare, color: "#06B6D4" };
  if (lowerText.includes("dashboard") || lowerText.includes("visibility")) return { icon: Eye, color: "#EC4899" };
  if (lowerText.includes("ready") || lowerText.includes("minutes")) return { icon: Zap, color: "#F59E0B" };
  if (lowerText.includes("permissions") || lowerText.includes("roles") || lowerText.includes("security")) return { icon: Shield, color: "#B45309" };
  if (lowerText.includes("support")) return { icon: Headphones, color: "#6366F1" };
  if (lowerText.includes("unlimited")) return { icon: Infinity, color: "#7C3AED" };
  if (lowerText.includes("integration")) return { icon: Plug, color: "#F97316" };
  if (lowerText.includes("onboarding")) return { icon: BookOpen, color: "#06B6D4" };
  if (lowerText.includes("everything")) return { icon: Check, color: "#10B981" };
  if (lowerText.includes("scales")) return { icon: TrendingUp, color: "#D946EF" };
  if (lowerText.includes("custom")) return { icon: Plug, color: "#D946EF" };
  if (lowerText.includes("assign")) return { icon: Check, color: "#10B981" };

  return { icon: Check, color: "#10B981" };
};

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that works for you.\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
  };

  return (
    <section className="py-20 md:py-24 px-4 md:px-6 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[#0D1F2D]">
            Get 6 hours back every week<br />
            for less than <span className="underline decoration-[#00D4A4] decoration-4 underline-offset-4">a coffee a day.</span>
          </h2>
          <p className="text-lg text-[#0D1F2D] mt-4">
            7 day free trial. Cancel anytime.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="absolute rounded-2xl bg-gradient-to-t from-[#00D4A4] 60% to-[#F8FAFC] h-[70%] w-[105%] left-1/2 -translate-x-1/2 bottom-0 translate-y-2 z-0" />
              )}
              <div
                className={cn(
                  "rounded-2xl border border-[#C8D8E6] p-6 bg-[#F8FAFC] flex flex-col relative z-10 min-h-[560px]",
                )}
              >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00D4A4] py-1 px-4 rounded-full flex items-center gap-1">
                  <Star className="h-4 w-4 text-white fill-white" />
                  <span className="text-white text-sm font-semibold">
                    Popular
                  </span>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                <p className="text-2xl font-semibold text-[#0D1F2D] mb-4">
                  {plan.name}
                </p>

                <div className="mt-2 mb-8 flex items-baseline gap-1">
                  {plan.price === "Contact us" ? (
                    <span className="text-5xl font-bold text-[#0D1F2D]">
                      Contact us
                    </span>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-[#0D1F2D]">
                        ${plan.price.split(".")[0]}
                      </span>
                      <span className="text-2xl font-medium text-[#4A6880]">
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
                        <span className="text-base font-medium text-[#2E4A62]">{feature}</span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href={plan.href}
                  className={cn(
                    buttonVariants({
                      variant: plan.isPopular ? "default" : "outline",
                      size: "lg",
                    }),
                    "w-full justify-center mt-auto",
                  )}
                >
                  {plan.buttonText}
                </Link>
              </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
