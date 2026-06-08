# Flowtex – Design System

## Color Palette

**Color Strategy:** Committed (one saturated accent, tinted neutrals)

**Theme:** Light mode (clean, accessible, modern premium)

### Light Mode Palette (Current)

- **Background (Base):** `#F8FAFC` – Off-white, cool-tinted
- **Surface (Card):** `#E8EFF5` – Soft blue-gray for cards
- **Elevated (Higher):** `#DDE6EF` – Slightly darker for depth
- **Text Primary:** `#0D1F2D` – Dark navy-blue, high contrast
- **Text Secondary:** `#2E4A62` – Medium gray-blue for supporting text
- **Text Muted:** `#4A6880` – Light gray-blue for tertiary text
- **Accent (Primary):** `#00D4A4` – Teal, vibrant and differentiating
- **Accent Hover:** `#00A882` – Darker teal for interactive states
- **Border (Subtle):** `#C8D8E6` – Light blue-gray for card borders
- **Success:** `#22C55E` – Emerald for positive states
- **Warning:** `#F59E0B` – Amber for warnings
- **Error:** `#EF4444` – Red for alerts, destructive actions

## Typography

- **Display/Headlines:** `Satoshi` or `Geist` (whichever feels premium-authoritative)
  - Scale: `text-4xl md:text-6xl` for H1
  - Weight: 700 (bold) for impact
  - Leading: `leading-tight` (control visual hierarchy, not just size)
- **Body:** `Satoshi` / `Inter` (fallback)
  - Scale: `text-base` for body, `text-sm` for secondary
  - Line length: max `65ch` for readability
  - Weight: 400 (normal) for body, 500 (medium) for interactive labels
- **Mono (Data/Code):** `JetBrains Mono` or `Geist Mono`
  - For API keys, code snippets, technical details

## Elevation & Shadows

- **Card Shadow (Subtle):** Light shadows for depth without weight
- **Hover Shadow (Teal-tinted):** `shadow-[0_40px_80px_-20px_rgba(0,212,164,0.15)]` (lifted, teal-tinted)
- **Card Border:** `border-[#C8D8E6]` for subtle definition
- **Glow Effect (CTA/Premium):** `shadow-glow` with inset shadow for premium feel
- **No Glass Morphism:** Clean borders and solid backgrounds for clarity

## Spacing & Rhythm

- **Section Vertical Gap:** `py-32 md:py-48` between major sections (generous, cinematic)
- **Internal Card Padding:** `p-8 md:p-10` (breathing room, not crammed)
- **Grid Gap:** `gap-6 md:gap-8` for bento/feature grids
- **Baseline Grid:** 4px (all spacing multiples of 4: 4, 8, 12, 16, 20, 24, 32, 48)

## Component Patterns

### Buttons

- **Primary CTA:** Solid `bg-[#00D4A4]` with hover state `bg-[#00A882]`
- **Secondary CTA:** Border `border-[#00D4A4]` with text color, transparent bg, hover fill
- **States:**
  - Hover: `scale-102` + shadow increase (physical tactile feedback)
  - Active: `-translate-y-[2px]` (simulate press-down)
  - Disabled: `opacity-50 cursor-not-allowed`

### Cards

- **Border Radius:** `rounded-2xl` for major containers, `rounded-xl` for smaller cards
- **Background:** `bg-[#E8EFF5]` (light blue-gray) with optional overlay gradient for visual interest
- **Border:** `border border-[#C8D8E6]` for subtle definition
- **Hover:** Shadow increase, subtle background shift
- **No Nested Cards:** (absolute ban)

### Feature Cards

- **Inner Card Pattern:** Positioned absolutely within feature cards for visual hierarchy
- **Content Layout:** Text content on one side (max 45% width), inner card on opposite side
- **Teal Accent Element:** Background matches feature card for cohesion, text uses primary color

### Forms

- **Input Style:** 
  - Background: `bg-[#F8FAFC]` with `border border-[#C8D8E6]`
  - Focus: `focus:border-[#00D4A4]` + `focus:ring-1 focus:ring-[#00D4A4]`
  - Padding: `px-4 py-2` (comfortable touch target)
- **Label:** Above input, `text-sm font-medium`, color `text-[#0D1F2D]`
- **Helper Text:** Below input, `text-xs text-[#4A6880]`
- **Error:** Red text below input, `text-[#EF4444]`, no extra icon noise

## Motion & Animation

- **Easing:** Exclusively exponential out curves (ease-out-quart, ease-out-quint)
- **Duration:** Micro (100ms–200ms), Standard (300ms–500ms), Macro (800ms+)
- **Spring Physics (Framer Motion):** `type: "spring", stiffness: 100, damping: 20` for weighty, premium feel
- **Perpetual Motion:** Subtle, infinite animations on stateful components (pulse, float, shimmer)
- **Layout Transitions:** Use `layout` prop for smooth re-ordering, morphing states
- **Ban:** No bounce/elastic easing. No overly fast animations (no `duration: 100ms` on full-page transitions).

## Responsive Breakpoints

- **Mobile First:** Base styles are mobile (`w-full px-4`)
- **Tablet:** `md:` (768px) – Introduce 2-column layouts, increase padding
- **Desktop:** `lg:` (1024px) – Full 3+ column grids, max-width containers
- **Collapse Rule (High-Variance):** Asymmetric desktop layouts must fall back to single column on mobile

## Accessibility

- **Color Contrast:** All text ≥4.5:1 WCAG AA
- **Focus States:** Visible `:focus` rings on interactive elements (indigo tint)
- **ARIA:** Semantic HTML; add `role`, `aria-label` where necessary
- **Keyboard Navigation:** All interactive elements reachable via Tab
- **Motion Sensitivity:** Respect `prefers-reduced-motion` query (Framer Motion built-in support)

## Anti-Patterns (Absolute Bans)

1. **No Side-Stripe Borders:** `border-left` accent colors are lazy. Use full borders or nothing.
2. **No Gradient Text:** `background-clip: text` is decorative. Use solid colors.
3. **No Hero Metrics Template:** Big number + small label is SaaS cliché. Use organic copy.
4. **No Identical Card Grids:** Vary card sizes and content density (Bento, Masonry, etc.).
5. **No Generic AI Vibes:** Purple/blue neon glows, crypto-style aesthetics, slop defaults.

## Design Tokens (Future-Ready)

```css
--color-bg-base: #F8FAFC;
--color-bg-secondary: #F1F5F9;
--color-bg-card: #E8EFF5;
--color-bg-elevated: #DDE6EF;
--color-text-primary: #0D1F2D;
--color-text-secondary: #2E4A62;
--color-text-muted: #4A6880;
--color-accent-teal: #00D4A4;
--color-accent-teal-hover: #00A882;
--color-border-subtle: #E2EAF1;
--color-border-default: #C8D8E6;
--color-border-strong: #A8BDD0;
--spacing-xs: 0.5rem;
--spacing-sm: 1rem;
--spacing-md: 1.5rem;
--spacing-lg: 2rem;
--spacing-xl: 3rem;
--spacing-2xl: 4rem;
--radius-sm: 0.5rem;
--radius-md: 1rem;
--radius-lg: 1.5rem;
--radius-xl: 2rem;
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
--shadow-glow: 0 0 20px rgba(0, 212, 164, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
```
