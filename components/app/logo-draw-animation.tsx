"use client";

import { useEffect, useRef, useState } from "react";

const BRAIN_PATHS = [
  "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
  "M9 13a4.5 4.5 0 0 0 3-4",
  "M6.003 5.125A3 3 0 0 0 6.401 6.5",
  "M3.477 10.896a4 4 0 0 1 .585-.396",
  "M6 18a4 4 0 0 1-1.967-.516",
];

const CIRCUIT_PATHS = [
  "M12 13h4",
  "M12 18h6a2 2 0 0 1 2 2v1",
  "M12 8h8",
  "M16 8V5a2 2 0 0 1 2-2",
];

const CIRCUIT_CIRCLES = [
  { cx: 16, cy: 13 },
  { cx: 18, cy: 3 },
  { cx: 20, cy: 21 },
  { cx: 20, cy: 8 },
];

interface LogoDrawAnimationProps {
  onComplete?: () => void;
}

export function LogoDrawAnimation({ onComplete }: LogoDrawAnimationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const endTextRef = useRef<HTMLDivElement>(null);
  const [circlesVisible, setCirclesVisible] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[data-animate]"))
      .sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));

    paths.forEach(p => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.style.strokeDashoffset = `${L}`;
      p.style.opacity = "1";
    });

    const DURATION = 400;
    const GAP = 60;

    const brainPaths = paths.filter(p => Number(p.dataset.order) < BRAIN_PATHS.length);
    const circuitPaths = paths.filter(p => Number(p.dataset.order) >= BRAIN_PATHS.length);

    let delay = 200;
    brainPaths.forEach(p => {
      setTimeout(() => {
        p.style.transition = `stroke-dashoffset ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        p.style.strokeDashoffset = "0";
      }, delay);
      delay += DURATION + GAP;
    });

    circuitPaths.forEach(p => {
      setTimeout(() => {
        p.style.transition = `stroke-dashoffset ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        p.style.strokeDashoffset = "0";
      }, delay);
    });
    delay += DURATION + GAP;

    setTimeout(() => setCirclesVisible(true), delay);

    // Show "Welcome to Flowtex"
    setTimeout(() => {
      const end = endTextRef.current;
      if (end) { end.style.opacity = "1"; end.style.transform = "translateY(0px)"; }
    }, delay + 400);

    // After 1.5s, fade out everything and call onComplete
    setTimeout(() => {
      const container = logoContainerRef.current;
      if (container) container.style.opacity = "0";
      setTimeout(() => onComplete?.(), 800);
    }, delay + 400 + 1500);

  }, [onComplete]);

  return (
    <div ref={logoContainerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-8)", opacity: 1, transition: "opacity 0.8s ease" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 24 24"
        width="180"
        height="180"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{}}
      >
        {CIRCUIT_PATHS.map((d, i) => (
          <path key={`circuit-${i}`} d={d} data-animate="true" data-order={BRAIN_PATHS.length + i} stroke="#F0D080" style={{ opacity: 0, transition: "none" }} />
        ))}
        {BRAIN_PATHS.map((d, i) => (
          <path key={`brain-${i}`} d={d} data-animate="true" data-order={i} stroke="#DFAA45" style={{ opacity: 0, transition: "none" }} />
        ))}
        {CIRCUIT_CIRCLES.map((c, i) => (
          <circle
            key={`circle-${i}`}
            cx={c.cx} cy={c.cy} r="0.5"
            fill="#F0D080" stroke="#F0D080"
            style={{
              opacity: circlesVisible ? 1 : 0,
              transform: circlesVisible ? "scale(1)" : "scale(0)",
              transformOrigin: `${c.cx}px ${c.cy}px`,
              transition: circlesVisible ? `opacity 0.3s ease ${i * 60}ms, transform 0.3s ease ${i * 60}ms` : "none",
            }}
          />
        ))}
      </svg>

      <div ref={endTextRef} style={{ opacity: 0, transform: "translateY(12px)", transition: "opacity 0.8s ease, transform 0.8s ease", textAlign: "center" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
          Welcome to Flowtex
        </h1>
      </div>
    </div>
  );
}
