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

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to login if not authenticated
          router.push("/login");
          return;
        }

        // For now, if user is logged in, they have access
        // In the future, check subscription/plan status
        setHasAccess(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
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
