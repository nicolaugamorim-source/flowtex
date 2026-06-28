"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UniqueLoading from "@/components/ui/morph-loading";
import { UpgradeRequired } from "./upgrade-required";
import { LoginRequired } from "./login-required";
import { OnboardingRequired } from "./onboarding-required";

interface AppGuardProps {
  children: React.ReactNode;
}

type GateState = "loading" | "no-session" | "onboarding-required" | "no-plan" | "ok";

function GuardLoading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
      <div className="text-center">
        <UniqueLoading variant="morph" size="lg" />
        <p className="text-[var(--color-text-muted)] mt-6">Loading...</p>
      </div>
    </div>
  );
}

function AppGuardInner({ children }: AppGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCheckedOut = searchParams.get("checkout") === "success";
  const [gate, setGate] = useState<GateState>("loading");

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async (userId: string | undefined) => {
      if (!userId) {
        if (isMounted) setGate("no-session");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, subscription_status, trial_ends_at")
        .eq("id", userId)
        .single();

      if (!isMounted) return;

      if (!profile?.onboarding_completed) {
        setGate("onboarding-required");
        return;
      }

      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const isActiveSubscription = profile.subscription_status === "active";
      const isValidTrial =
        profile.subscription_status === "trialing" && trialEndsAt && trialEndsAt > new Date();

      if (!isActiveSubscription && !isValidTrial) {
        // Stripe's success redirect can land here before its webhook has
        // finished syncing subscription_status — trust this one-time param
        // (it only appears right after Stripe itself confirms payment)
        // instead of bouncing a paying user to /pricing.
        if (justCheckedOut) {
          setGate("ok");
          return;
        }
        // No message gate for this one — go straight to pricing.
        router.replace("/pricing");
        return;
      }

      setGate("ok");
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      await checkAccess(session?.user?.id);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!isMounted) return;
        checkAccess(newSession?.user?.id);
      });

      return () => subscription?.unsubscribe();
    };

    const cleanupPromise = init();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [router, justCheckedOut]);

  if (gate === "loading") return <GuardLoading />;
  if (gate === "no-session") return <LoginRequired />;
  if (gate === "onboarding-required") return <OnboardingRequired />;
  if (gate === "no-plan") return <UpgradeRequired />;

  return <>{children}</>;
}

export function AppGuard({ children }: AppGuardProps) {
  return (
    <Suspense fallback={<GuardLoading />}>
      <AppGuardInner>{children}</AppGuardInner>
    </Suspense>
  );
}
