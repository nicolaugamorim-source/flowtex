import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ExpiredPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center p-4 bg-[var(--color-bg-base)]">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">
            Your trial has ended
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg">
            Your 7-day trial has expired. Continue with Flowtex for $29/month.
          </p>
        </div>

        <Link
          href="/api/stripe/checkout?plan=solo"
          className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-lg transition-colors"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-primary)" }}
        >
          Continue with Flowtex
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
