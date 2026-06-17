"use client";

import { useEffect } from "react";
import { useCookieDialog } from "@/lib/cookie-context";
import { CookieConsent } from "./cookie-consent";

export function CookieConsentManager() {
  const { openCustomizeDialog } = useCookieDialog();

  // Listen for external cookie open event
  useEffect(() => {
    const handleOpenCookies = () => {
      openCustomizeDialog();
    };

    window.addEventListener("open-cookie-dialog", handleOpenCookies);
    return () => window.removeEventListener("open-cookie-dialog", handleOpenCookies);
  }, [openCustomizeDialog]);

  return <CookieConsent />;
}
