"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/ui/login-signup";
import { useToast } from "@/components/ui/toast-provider";
import { LOGIN_ERROR_MESSAGES, getOAuthErrorMessage } from "@/lib/oauth-error-messages";
import { LogOut } from "lucide-react";

// Reads the `?error=` code the OAuth callback redirects with on failure
// (previously silently ignored) and surfaces it as a toast. Split out from
// the page component because useSearchParams requires a Suspense boundary
// during static prerendering, and LoginForm itself doesn't need to wait on it.
function LoginErrorToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error || shown.current) return;
    shown.current = true;

    toast.show({
      ...getOAuthErrorMessage(error, LOGIN_ERROR_MESSAGES),
      tone: "error",
      icon: LogOut,
    });

    // Drop the param so refreshing the page doesn't re-show the toast.
    router.replace("/login");
  }, [searchParams, router, toast]);

  return null;
}

// Login route — renders the shared LoginForm, and surfaces any OAuth error.
export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginErrorToast />
      </Suspense>
      <LoginForm />
    </>
  );
}
