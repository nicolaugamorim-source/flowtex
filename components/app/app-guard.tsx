"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UpgradeRequired } from "./upgrade-required";

interface AppGuardProps {
  children: React.ReactNode;
}

export function AppGuard({ children }: AppGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log("Auth state changed:", event, session?.user?.email);

        if (session?.user) {
          setUser(session.user);
          setHasAccess(true);
          setSessionChecked(true);
          setIsLoading(false);
        } else {
          setUser(null);
          setHasAccess(false);
          setSessionChecked(true);
          setIsLoading(false);

          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            router.push("/login");
          } else if (event === 'INITIAL_SESSION' || event === null) {
            // Initial session check - no user
            router.push("/login");
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <UpgradeRequired />;
  }

  return <>{children}</>;
}
