"use client";

import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface GateScreenProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export function GateScreen({ icon: Icon, title, description, ctaLabel, ctaHref }: GateScreenProps) {
  return (
    <div className="w-full h-screen flex items-center justify-center p-[var(--space-4)] bg-[var(--color-bg-base)]">
      <div className="max-w-md w-full text-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-[var(--space-8)]">
        <div
          className="mx-auto mb-[var(--space-5)] flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-accent-subtle)" }}
        >
          <Icon className="h-6 w-6" style={{ color: "var(--color-accent)" }} />
        </div>

        <h1 className="text-[length:var(--text-2xl)] font-semibold text-[var(--color-text-primary)] mb-[var(--space-2)]">{title}</h1>
        <p className="text-[var(--color-text-secondary)] text-[length:var(--text-base)] mb-[var(--space-8)]">{description}</p>

        <Link
          href={ctaHref}
          prefetch={false}
          className="inline-flex items-center gap-[var(--space-2)] font-semibold px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-primary)" }}
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
