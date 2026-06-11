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

  useEffect(() => {
    let isMounted = true;
    let redirectTimeout: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        // First, try to get existing session
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          console.log("✅ Session found:", session.user.email);
          setUser(session.user);
          setHasAccess(true);
          setIsLoading(false);
          return;
        }

        // If no session, wait for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            if (!isMounted) return;

            console.log("🔄 Auth event:", event, newSession?.user?.email);

            if (newSession?.user) {
              setUser(newSession.user);
              setHasAccess(true);
              setIsLoading(false);
            } else {
              setHasAccess(false);
              setIsLoading(false);

              // Only redirect after a small delay to ensure session is really gone
              redirectTimeout = setTimeout(() => {
                if (isMounted && !newSession?.user) {
                  console.log("❌ No session, redirecting to login");
                  router.push("/login");
                }
              }, 500);
            }
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error("Auth init error:", error);
        if (isMounted) {
          setIsLoading(false);
          redirectTimeout = setTimeout(() => {
            if (isMounted) router.push("/login");
          }, 500);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (redirectTimeout) clearTimeout(redirectTimeout);
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
