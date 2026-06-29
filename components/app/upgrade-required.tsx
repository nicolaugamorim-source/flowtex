"use client";

import { CreditCard } from "lucide-react";
import { GateScreen } from "./gate-screen";

export function UpgradeRequired() {
  return (
    <GateScreen
      icon={CreditCard}
      title="Choose a plan to continue"
      description="You haven't selected a plan yet. Pick one to unlock the full power of Flowtex."
      ctaLabel="View pricing"
      ctaHref="/pricing"
    />
  );
}
