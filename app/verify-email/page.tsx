import { Suspense } from "react";
import { VerifyEmailContent } from "@/components/ui/verify-email-content";

// Landing page for the email verification link sent after signup. Wraps the
// client content in Suspense since it reads verification state from the URL.
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
