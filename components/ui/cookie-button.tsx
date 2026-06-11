"use client";

import { useCookieDialog } from "@/lib/cookie-context";

export function CookieButton() {
  const { openCustomizeDialog } = useCookieDialog();

  return (
    <button
      onClick={openCustomizeDialog}
      className="text-sm text-[#4A6880] underline-offset-4 hover:underline"
    >
      Cookies
    </button>
  );
}
