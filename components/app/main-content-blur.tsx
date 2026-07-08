"use client";

import { useEffect, useState } from "react";
import { SIDEBAR_HOVER_EVENT } from "@/components/ui/sidebar";

// Blurs the rest of the page while the sidebar is expanded (hover), so it reads as a
// panel floating above the content rather than just squeezing it. Uses a backdrop-filter
// overlay rather than `filter: blur()` on the content itself — the latter forces the
// browser to re-rasterize the whole subtree every frame, which reads as low-FPS/laggy.
export function MainContentBlur({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const expanded = (e as CustomEvent<boolean>).detail;
      setSidebarExpanded(!!expanded);
    };
    window.addEventListener(SIDEBAR_HOVER_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_HOVER_EVENT, handler);
  }, []);

  return (
    <main className="relative flex-1 ml-[3.05rem]">
      {children}
      {/* Fixed (not absolute) so it always covers exactly what's on screen, regardless
          of how tall the page content is or how far it's scrolled — an absolutely
          positioned overlay only spans <main>'s own box, which grows with scrollable
          content, and backdrop-filter over that full (often much taller) height doesn't
          reliably keep covering the part that's scrolled into view. */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 30,
          pointerEvents: "none",
          opacity: sidebarExpanded ? 1 : 0,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          transition: "opacity 0.2s ease",
        }}
      />
    </main>
  );
}
