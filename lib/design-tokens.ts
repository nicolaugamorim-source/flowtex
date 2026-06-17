// Flowtex Design Tokens – Centralized, Metric-Based System
// All spacing uses 4px baseline grid for mathematical precision

export const DESIGN_TOKENS = {
  // Color Palette (OKLCH-based, high-end)
  colors: {
    // Neutrals (near-black, professional depth)
    bg: {
      primary: "#0A0A0A", // Pure near-black
      surface: "#121218", // Deep charcoal
      overlay: "rgba(10, 10, 10, 0.85)",
    },
    text: {
      primary: "#F5F5F5", // Pure white
      secondary: "#A0A0A0", // Warm neutral gray
      tertiary: "#808080", // Darker secondary
    },
    // Accents (warm gold + sage, luxury minimalist)
    accent: {
      gold: "#D4934E", // Warm copper/gold - primary accent
      sage: "#7A9B8E", // Soft sage green - secondary
      copper: "#D4934E", // Alias for gold
      warm: "#E8D5C4", // Warm highlight for subtle accents
    },
    // Semantic
    success: "#10B981",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
    info: "var(--color-info)",
  },

  // Typography Scale (fluid, 1.25 ratio between steps)
  typography: {
    // Display (H1)
    display: {
      size: "clamp(2.75rem, 5.5vw, 5.5rem)",
      lineHeight: "1.2",
      letterSpacing: "-0.015em",
      fontWeight: 700,
    },
    // Heading 2
    h2: {
      size: "clamp(2.5rem, 5vw, 4rem)",
      lineHeight: "1.2",
      letterSpacing: "-0.01em",
      fontWeight: 700,
    },
    // Heading 3
    h3: {
      size: "clamp(1.875rem, 4vw, 2.5rem)",
      lineHeight: "1.3",
      letterSpacing: "0em",
      fontWeight: 600,
    },
    // Body
    body: {
      size: "1rem", // 16px
      lineHeight: "1.6",
      maxWidth: "65ch",
      fontWeight: 400,
    },
    bodySmall: {
      size: "0.875rem", // 14px
      lineHeight: "1.5",
      fontWeight: 400,
    },
    // Label/Caption
    caption: {
      size: "0.75rem", // 12px
      lineHeight: "1.4",
      fontWeight: 500,
      letterSpacing: "0.05em",
    },
  },

  // Spacing (4px baseline grid)
  spacing: {
    0: "0px",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
    32: "8rem", // 128px
    48: "12rem", // 192px
  },

  // Border Radius
  radius: {
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    full: "9999px",
  },

  // Shadows (with color tint, not pure black)
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 20px 40px -15px rgba(0, 0, 0, 0.3)",
    xl: "0 40px 80px -20px rgba(99, 102, 241, 0.2)", // Indigo-tinted
    inset: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },

  // Breakpoints
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // Motion (exponential out easing, premium springs)
  motion: {
    // Durations
    fast: "100ms",
    normal: "300ms",
    slow: "500ms",
    slower: "800ms",

    // Easing (Framer Motion preset names)
    easeOutQuart: "easeOut",
    easeOutQuint: "easeOut",
    easeOutExpo: "easeOut",

    // Spring physics (Framer Motion)
    spring: {
      light: { type: "spring" as const, stiffness: 100, damping: 20, mass: 0.5 },
      default: { type: "spring" as const, stiffness: 100, damping: 20 },
      tight: { type: "spring" as const, stiffness: 150, damping: 25 },
    },
  },

  // Z-Index Stack
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Container sizes
  containers: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    max: "1400px",
  },
} as const

// Utility types
export type SpacingValue = keyof typeof DESIGN_TOKENS.spacing
export type ColorKey = keyof typeof DESIGN_TOKENS.colors
