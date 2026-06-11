"use client";

import { useEffect } from "react";

export function AuthHandler() {
  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes("access_token")) {
      // Redirect to app with full URL to avoid localhost issues
      window.location.href = `${window.location.origin}/app`;
    }
  }, []);

  return null;
}
