"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/ui/login-signup";
import { useToast } from "@/components/ui/toast-provider";
import { LOGIN_ERROR_MESSAGES, getOAuthErrorMessage } from "@/lib/oauth-error-messages";
import { LogOut } from "lucide-react";

// Login route — renders the shared LoginForm, and surfaces the `?error=` code
// the OAuth callback redirects with on failure (previously silently ignored).
export default function LoginPage() {
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

  return <LoginForm />;
}
