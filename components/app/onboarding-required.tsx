"use client";

import { ClipboardList } from "lucide-react";
import { GateScreen } from "./gate-screen";

export function OnboardingRequired() {
  return (
    <GateScreen
      icon={ClipboardList}
      title="Finish setting up your account"
      description="We still need a few details about you and your business before you can use Flowtex."
      ctaLabel="Complete onboarding"
      ctaHref="/onboarding"
    />
  );
}
