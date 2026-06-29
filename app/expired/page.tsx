"use client";

import { Clock } from "lucide-react";
import { GateScreen } from "@/components/app/gate-screen";

export default function ExpiredPage() {
  return (
    <GateScreen
      icon={Clock}
      title="Your trial has ended"
      description="Your 7-day trial has expired. Continue with Flowtex for $29/month."
      ctaLabel="Continue with Flowtex"
      ctaHref="/api/stripe/checkout?plan=solo"
    />
  );
}
