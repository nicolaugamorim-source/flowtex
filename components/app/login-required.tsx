"use client";

import { LogIn } from "lucide-react";
import { GateScreen } from "./gate-screen";

export function LoginRequired() {
  return (
    <GateScreen
      icon={LogIn}
      title="You're not logged in"
      description="Log in to access your Flowtex dashboard."
      ctaLabel="Go to login"
      ctaHref="/login"
    />
  );
}
