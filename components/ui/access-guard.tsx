"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { checkAppAccess, UserAccess } from "@/lib/access-control";
import { Button } from "./button";

interface AccessGuardProps {
  children: React.ReactNode;
}

export function AccessGuard({ children }: AccessGuardProps) {
  const router = useRouter();
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const userAccess = await checkAppAccess(user.id);
        setAccess(userAccess);

        if (!userAccess.hasAccess) {
          if (!userAccess.emailVerified) {
            router.push("/verify-email");
          } else {
            router.push("/pricing");
          }
        }
      } catch (error) {
        console.error("Access check error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
      </div>
    );
  }

  if (!access?.hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">{access?.reason || "You don't have access to this area"}</p>

          {!access?.emailVerified && (
            <Button
              onClick={() => window.location.href = "/verify-email"}
              className="w-full"
            >
              Verify Email
            </Button>
          )}

          {access?.subscription === "free" && (
            <Button
              onClick={() => window.location.href = "/pricing"}
              className="w-full"
            >
              Upgrade to Premium
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
