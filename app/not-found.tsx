"use client";

import { Compass } from "lucide-react";
import { GateScreen } from "@/components/app/gate-screen";

// Shown for any URL that doesn't match a route — replaces Next.js's default
// 404, which looked jarringly out of place on a paid product.
export default function NotFound() {
  return (
    <GateScreen
      icon={Compass}
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      ctaLabel="Back to Flowtex"
      ctaHref="/"
    />
  );
}
