"use client";

import { useEffect, useRef, useState } from "react";

// Measures how many fixed-height rows actually fit inside a container (using the
// first already-rendered row + its gap as the unit) and keeps that count in sync
// via ResizeObserver — so cards show exactly as many items as fit, no internal
// scroll needed, and larger screens naturally show more instead of being capped
// at a hardcoded number.
//
// `deps` should include anything that swaps the container's *first child* for a
// differently-sized element — e.g. a loading flag that swaps a skeleton row for a
// real row. Without that, the very first measurement (often taken against a much
// shorter skeleton row) would stick forever: the container's own height doesn't
// change once real content replaces the skeleton, so ResizeObserver alone never
// fires again to correct it.
export function useFitCount<T extends HTMLElement>(fallback: number, deps: unknown[] = []) {
  const ref = useRef<T>(null);
  const [count, setCount] = useState(fallback);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // 1px safety margin: sub-pixel rounding between clientHeight (container) and
    // getBoundingClientRect (item) can make the math land just barely over the real
    // available space, clipping the last row instead of leaving it out entirely.
    const SAFETY_PX = 1;

    const compute = () => {
      const firstItem = container.firstElementChild as HTMLElement | null;
      if (!firstItem) return;
      const itemHeight = firstItem.getBoundingClientRect().height;
      if (itemHeight <= 0) return;
      const gap = parseFloat(getComputedStyle(container).rowGap || "0") || 0;
      const available = container.clientHeight - SAFETY_PX;
      const fitted = Math.floor((available + gap) / (itemHeight + gap));
      setCount(Math.max(1, fitted));
    };

    // Run after paint so the just-swapped-in first child has a real layout box.
    const raf = requestAnimationFrame(compute);
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, count };
}
