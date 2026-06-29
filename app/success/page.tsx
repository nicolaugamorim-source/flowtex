"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

function formatDate(dateOnly: string): string {
  // dateOnly is "YYYY-MM-DD" — parse at midnight UTC so the date never
  // shifts a day depending on the viewer's timezone.
  return new Date(`${dateOnly}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const isTrial = searchParams.get("trial") === "true";
  const trialEnds = searchParams.get("trial_ends");

  return (
    <div className="w-full h-screen flex items-center justify-center p-4 bg-[var(--color-bg-base)]">
      <div className="max-w-md w-full text-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-8">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-accent-subtle)" }}
        >
          {isTrial ? (
            <Sparkles className="h-6 w-6" style={{ color: "var(--color-accent)" }} />
          ) : (
            <CheckCircle2 className="h-6 w-6" style={{ color: "var(--color-success)" }} />
          )}
        </div>

        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
          {isTrial ? "Your free trial has started" : "Payment successful"}
        </h1>

        <p className="text-[var(--color-text-secondary)] text-base mb-8">
          {isTrial && trialEnds
            ? `You're all set — your 7-day free trial is active. You won't be charged until ${formatDate(trialEnds)}.`
            : isTrial
              ? "You're all set — your 7-day free trial is active."
              : "You're all set — welcome to Flowtex."}
        </p>

        <Link
          href="/app?checkout=success"
          prefetch={false}
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-primary)" }}
        >
          Go to Flowtex
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-[var(--color-bg-base)]" />}>
      <SuccessContent />
    </Suspense>
  );
}
