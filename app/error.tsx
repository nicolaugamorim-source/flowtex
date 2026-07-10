"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// Root error boundary — catches anything that throws while rendering and
// replaces Next.js's default error screen, which (like the default 404)
// looked out of place on a paid product. Mirrors GateScreen's look, but
// needs its own markup since this needs a "reset" action, not a link.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="w-full h-screen flex items-center justify-center p-[var(--space-4)] bg-[var(--color-bg-base)]">
      <div className="max-w-md w-full text-center rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-[var(--space-8)]">
        <div
          className="mx-auto mb-[var(--space-5)] flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-accent-subtle)" }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: "var(--color-accent)" }} />
        </div>

        <h1 className="text-[length:var(--text-2xl)] font-semibold text-[var(--color-text-primary)] mb-[var(--space-2)]">
          Something went wrong
        </h1>
        <p className="text-[var(--color-text-secondary)] text-[length:var(--text-base)] mb-[var(--space-8)]">
          An unexpected error occurred. Please try again — if it keeps happening, let us know.
        </p>

        <div className="flex items-center justify-center gap-[var(--space-3)]">
          <button
            onClick={reset}
            className="font-semibold px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-text-primary)" }}
          >
            Try again
          </button>
          <a
            href="/"
            className="font-semibold px-[var(--space-6)] py-[var(--space-3)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            Back to Flowtex
          </a>
        </div>
      </div>
    </div>
  );
}
