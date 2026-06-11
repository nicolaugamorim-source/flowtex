"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes("access_token")) {
      // Remove hash from URL
      window.history.replaceState(null, "", window.location.pathname);
      // Redirect to dashboard or app
      router.push("/app");
    }
  }, [router]);

  return null;
}
