"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogoDrawAnimation } from "./logo-draw-animation";
import { SIDEBAR_ONBOARDING_EVENT } from "@/components/ui/sidebar";
import { AIInputWithSearch } from "@/components/ui/ai-input-with-search";
import { setOnboardingActive } from "@/lib/onboarding-state";
import { emitKanbanGuideEvent } from "@/lib/kanban-guide";
import { getCalendarsConfiguredFlag } from "@/lib/dashboard-guide";

type Phase = "idle" | "animation" | "blur" | "done";
type ChatSimPhase = "hidden" | "input" | "loading" | "shown";

const PAD = 14;
const RADIUS = 16;

interface StepBase {
  id: string;
}
interface FullscreenStep extends StepBase {
  kind: "fullscreen";
  title: ReactNode;
}
interface SidebarStep extends StepBase {
  kind: "sidebar";
  text: ReactNode;
  navigateTo?: string;
}
interface SpotlightStep extends StepBase {
  kind: "spotlight";
  selector?: string;
  group?: string;
  text: ReactNode;
  skipTo?: string;
  onEnter?: () => void;
  optional?: boolean;
  textBelow?: boolean;
  extraBottomPad?: number;
}
interface InteractiveStep extends StepBase {
  kind: "interactive";
  selector?: string;
  group?: string;
  text: ReactNode;
  skipTo?: string;
  onEnter?: () => void;
  opensModal?: boolean;
  optional?: boolean;
  // Skip the clip-path hole entirely and just let clicks through everywhere — safer than
  // relying on pixel-precise hole targeting for small buttons that open a real modal.
  fullRelease?: boolean;
}
interface ChatbotStep extends StepBase {
  kind: "chatbot";
}

type Step = FullscreenStep | SidebarStep | SpotlightStep | InteractiveStep | ChatbotStep;

function setSidebarOnboarding(detail: { forceOpen: boolean; disableHover: boolean } | null) {
  window.dispatchEvent(new CustomEvent(SIDEBAR_ONBOARDING_EVENT, { detail }));
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  return (
    `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
    `V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
    `H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`
  );
}

function singleRect(selector: string): DOMRect | null {
  const el = document.querySelector<HTMLElement>(`[data-onboarding="${selector}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function unionRect(group: string): DOMRect | null {
  // ~= matches a space-separated word, so one element can belong to multiple groups
  // (e.g. the "done" column is part of both "kanban-review-done" and "kanban-drag-zone").
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-onboarding-group~="${group}"]`));
  if (els.length === 0) return null;
  const rects = els.map((e) => e.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return new DOMRect(left, top, right - left, bottom - top);
}

function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="underline decoration-[var(--color-accent)] decoration-4 underline-offset-6">
      {children}
    </span>
  );
}

// Hardcoded simulation of the assistant's first message — this is NOT a real
// AI call, just static copy so the onboarding preview never depends on the API.
const CHATBOT_SIM_BULLETS = [
  "Draft and send emails straight from the chat",
  "Summarize your day and upcoming meetings",
  "Create tasks and calendar events with a simple request",
];

// ---------------------------------------------------------------------------
// Step definitions, in order. `skipTo` jumps ahead by id; `navigateTo` on a
// sidebar step drives a real route change once the user continues past it.
// ---------------------------------------------------------------------------
const STEPS: Step[] = [
  { id: "dash-intro", kind: "fullscreen", title: <>This is your <Highlight>dashboard</Highlight></> },
  {
    id: "dash-calendar-select", kind: "interactive", selector: "calendar-selection-card", optional: true,
    text: <>Pick which <Highlight>calendars</Highlight> Flowtex should show events from, then save.</>,
  },
  {
    id: "dash-appointments", kind: "spotlight", selector: "appointments-card",
    text: <>This card keeps all your <Highlight>appointments</Highlight> for this week and next in one place.</>,
  },
  {
    id: "dash-inbox-card", kind: "spotlight", selector: "inbox-card",
    text: <>Get a live feed of your new <Highlight>messages</Highlight> without leaving the dashboard.</>,
  },
  {
    id: "dash-tasks-card", kind: "spotlight", selector: "tasks-card",
    text: <>Your most <Highlight>important tasks</Highlight> are queued up and ready to go.</>,
  },
  {
    id: "dash-streak-card", kind: "spotlight", selector: "streak-card",
    text: <>Your <Highlight>streak grows</Highlight> every day you use Flowtex — chat with the assistant, move a task forward, or create something new.</>,
  },
  { id: "dash-chatbot", kind: "chatbot" },
  {
    id: "dash-sidebar", kind: "sidebar", navigateTo: "/app/inbox",
    text: <>This is the <Highlight>sidebar</Highlight>, here you have all the pages we&apos;ll go through.</>,
  },
  { id: "inbox-intro", kind: "fullscreen", title: <>This is your <Highlight>inbox</Highlight></> },
  {
    id: "inbox-list", kind: "spotlight", selector: "inbox-list",
    text: <>Search and browse every <Highlight>email</Highlight> that lands in your inbox, right from here.</>,
  },
  {
    id: "inbox-expanded", kind: "spotlight", selector: "inbox-expanded",
    onEnter: () => window.dispatchEvent(new CustomEvent("flowtex:inbox-guide-select-first")),
    text: <>Click any email to read it <Highlight>expanded</Highlight> here, without leaving the list.</>,
  },
  {
    id: "kanban-sidebar", kind: "sidebar", navigateTo: "/app/kanban",
    text: <>Let&apos;s check out the <Highlight>Kanban</Highlight> board.</>,
  },
  {
    id: "kanban-columns", kind: "spotlight", group: "kanban-column-header", textBelow: true,
    text: <>Tasks move through four stages: <Highlight>Backlog, In Progress, Review and Done</Highlight>.</>,
  },
  {
    id: "kanban-task-intro", kind: "spotlight", selector: "kanban-column-todo", skipTo: "kanban-inprogress-demo",
    text: <>Let&apos;s create your <Highlight>first task</Highlight>.</>,
  },
  {
    id: "kanban-task-create", kind: "interactive", selector: "kanban-column-todo", skipTo: "kanban-inprogress-demo",
    text: <>Click <Highlight>Add Task</Highlight>, give it a title, then set its <Highlight>priority</Highlight> and <Highlight>tag</Highlight> before hitting Add.</>,
  },
  {
    id: "kanban-inprogress-demo", kind: "interactive", selector: "kanban-column-in_progress",
    onEnter: () => emitKanbanGuideEvent({ type: "inject-demo-tasks" }),
    text: <>Tasks are sorted by <Highlight>priority</Highlight> first, then however you like within that priority. Try dragging the two medium-priority cards to reorder them.</>,
  },
  {
    id: "kanban-drag-done", kind: "interactive", group: "kanban-drag-zone",
    text: <>Now drag the <Highlight>high-priority</Highlight> card from In Progress all the way into Done.</>,
  },
  {
    id: "kanban-review-done-explain", kind: "spotlight", group: "kanban-review-done",
    text: <><Highlight>Review</Highlight> is for a final check before shipping. Once something&apos;s Done, <Highlight>archive</Highlight> it to keep the board clean.</>,
  },
  {
    id: "kanban-archived-button", kind: "interactive", selector: "kanban-archived-toggle",
    text: <>Click here to see everything you&apos;ve <Highlight>archived</Highlight>.</>,
  },
  {
    id: "kanban-archived-page", kind: "spotlight", selector: "kanban-archived-page", textBelow: true, extraBottomPad: 160,
    text: <>Here you&apos;ll find every <Highlight>archived task</Highlight>, ordered by when it was archived — nothing is ever really deleted.</>,
  },
  {
    id: "clients-sidebar", kind: "sidebar", navigateTo: "/app/clients",
    text: <>There&apos;s one more page — your <Highlight>Clients</Highlight>.</>,
  },
  {
    id: "clients-create-do", kind: "interactive", selector: "clients-add-button", opensModal: true, skipTo: "clients-list",
    text: <>Let&apos;s add your <Highlight>first client</Highlight>.</>,
  },
  {
    id: "clients-list", kind: "spotlight", group: "clients-list-search",
    text: <>Search and browse your <Highlight>clients</Highlight> here.</>,
  },
  {
    id: "clients-detail", kind: "spotlight", selector: "clients-detail-header", optional: true,
    text: <>Everything about a client lives in one <Highlight>view</Highlight>.</>,
  },
  {
    id: "clients-tab-overview", kind: "spotlight", selector: "clients-tab-overview",
    onEnter: () => window.dispatchEvent(new CustomEvent("flowtex:clients-guide-set-tab", { detail: "overview" })),
    text: <><Highlight>Overview</Highlight> shows the last email, next meeting, and an AI-generated read on the relationship.</>,
  },
  {
    id: "clients-tab-emails", kind: "spotlight", selector: "clients-tab-emails",
    onEnter: () => window.dispatchEvent(new CustomEvent("flowtex:clients-guide-set-tab", { detail: "emails" })),
    text: <>Every <Highlight>email</Highlight> exchanged with this client, matched automatically.</>,
  },
  {
    id: "clients-tab-meetings", kind: "spotlight", selector: "clients-tab-meetings",
    onEnter: () => window.dispatchEvent(new CustomEvent("flowtex:clients-guide-set-tab", { detail: "meetings" })),
    text: <>Past and upcoming <Highlight>meetings</Highlight> with this client, in one list.</>,
  },
  {
    id: "clients-tab-notes", kind: "spotlight", selector: "clients-tab-notes",
    onEnter: () => window.dispatchEvent(new CustomEvent("flowtex:clients-guide-set-tab", { detail: "notes" })),
    text: <>Keep free-form <Highlight>notes</Highlight> here — context, preferences, anything worth remembering.</>,
  },
  {
    id: "final-sidebar", kind: "sidebar", navigateTo: "/app",
    text: <>You&apos;ve still got <Highlight>Feedback, Integrations, Chat History</Highlight> and <Highlight>Settings</Highlight> to explore whenever you&apos;re ready.</>,
  },
  {
    id: "final-outro", kind: "fullscreen",
    title: <>You&apos;re all set — enjoy <Highlight>Flowtex</Highlight>!</>,
  },
];

// Routes required by steps that can be jumped to directly (e.g. from a dev "Start at X"
// button) rather than reached by walking the guide from the very beginning.
const ENTRY_ROUTES: Partial<Record<string, string>> = {
  "kanban-archived-button": "/app/kanban",
};

export function WelcomeOverlay() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState<Step>(STEPS[0]);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [textSide, setTextSide] = useState<"left" | "right">("left");
  const [chatSim, setChatSim] = useState<ChatSimPhase>("hidden");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startStepIdRef = useRef<string>(STEPS[0].id);

  const stepIndex = STEPS.findIndex((s) => s.id === step.id);
  const isLastStep = stepIndex === STEPS.length - 1;

  // Block the real "\" shortcut (which opens the actual assistant) for as long as
  // this guide is running. Driven directly off `phase` rather than mount/unmount so
  // it survives React StrictMode's dev-mode double-invoke of effect cleanups.
  useEffect(() => {
    setOnboardingActive(phase !== "idle" && phase !== "done");
  }, [phase]);

  // Make sure the sidebar always regains normal behaviour if this overlay unmounts.
  useEffect(() => () => setSidebarOnboarding(null), []);

  // Track the real "Add Client" modal so we can get out of its way — it renders
  // as a centred, viewport-wide overlay that our spotlight cutout would otherwise clip.
  useEffect(() => {
    const onOpen = () => setClientModalOpen(true);
    const onClose = () => setClientModalOpen(false);
    window.addEventListener("flowtex:clients-guide-modal-open", onOpen);
    window.addEventListener("flowtex:clients-guide-modal-close", onClose);
    return () => {
      window.removeEventListener("flowtex:clients-guide-modal-open", onOpen);
      window.removeEventListener("flowtex:clients-guide-modal-close", onClose);
    };
  }, []);

  // Fade out the current step, run its onEnter side-effect, remeasure, fade the next one in.
  // Measurement retries for a bit: after a route change the target page's data-onboarding
  // elements may take longer than any fixed delay to mount (route chunk load, data fetch, etc).
  const goTo = useCallback((next: Step, delay: number) => {
    setVisible(false);
    setTimeout(() => {
      const onEnter = "onEnter" in next ? next.onEnter : undefined;
      onEnter?.();

      // Force the sidebar open (and freeze its hover) up front — its width animates over
      // ~200ms, so we need this dispatched before we start polling its rect, not after.
      if (next.kind === "sidebar") setSidebarOnboarding({ forceOpen: true, disableHover: true });

      const getRect = (): DOMRect | null => {
        if (next.kind === "sidebar") return singleRect("sidebar-nav");
        if (next.kind === "spotlight" || next.kind === "interactive") {
          return next.group ? unionRect(next.group) : next.selector ? singleRect(next.selector) : null;
        }
        return null;
      };

      const needsRect = next.kind === "sidebar" || next.kind === "spotlight" || next.kind === "interactive";
      const isOptional = (next.kind === "spotlight" || next.kind === "interactive") && next.optional;
      // Optional steps (e.g. "pick a calendar", only relevant if that's not already done)
      // skip themselves instead of showing a broken full-dark step if the element never
      // shows up. Give this a real budget though — e.g. calendar config status comes from
      // an API call that hasn't necessarily resolved yet when we first check.
      const maxAttempts = isOptional ? 14 : 20;

      // The dashboard tells us as soon as it knows whether calendars are configured, so
      // we don't have to blindly poll the DOM for ~2s in the common case where they already are.
      if (next.id === "dash-calendar-select" && getCalendarsConfiguredFlag() === true) {
        const idx = STEPS.findIndex((s) => s.id === next.id);
        const fallback = STEPS[idx + 1];
        if (fallback) { goTo(fallback, 0); return; }
      }

      const attemptMeasure = (attemptsLeft: number) => {
        const r = getRect();
        if (!r && needsRect && attemptsLeft > 0) {
          setTimeout(() => attemptMeasure(attemptsLeft - 1), 150);
          return;
        }
        if (!r && isOptional) {
          const idx = STEPS.findIndex((s) => s.id === next.id);
          const fallback = STEPS[idx + 1];
          if (fallback) { goTo(fallback, 0); return; }
        }
        setRect(r);
        if (r) {
          const spaceLeft = r.left;
          const spaceRight = window.innerWidth - r.right;
          setTextSide(spaceRight >= spaceLeft ? "right" : "left");
        }
        setStep(next);
        requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      };

      // The sidebar's width animates over ~200ms after being forced open — wait for that
      // to settle before measuring, otherwise we'd capture it mid-transition (too narrow).
      const settleDelay = (onEnter ? 350 : 0) + (next.kind === "sidebar" ? 250 : 0);
      setTimeout(() => attemptMeasure(maxAttempts), settleDelay);
    }, delay);
  }, []);

  // Lands on whatever step `startStepIdRef` points to — the very first step (full guide) or
  // a specific one (dev shortcut, e.g. the "Start 2" button), navigating first if it needs to.
  const beginGuide = useCallback(() => {
    setPhase("blur");
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayVisible(true)));

    const target = STEPS.find((s) => s.id === startStepIdRef.current) || STEPS[0];
    const route = ENTRY_ROUTES[target.id];
    let navigated = false;
    if (route && typeof window !== "undefined" && window.location.pathname !== route) {
      router.push(route);
      navigated = true;
    }

    if (target.id === STEPS[0].id) {
      // The very first step is already the current `step` state — just reveal it.
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      goTo(target, navigated ? 700 : 0);
    }
  }, [router, goTo]);

  const handleAnimationComplete = useCallback(() => {
    const overlay = overlayRef.current;
    if (overlay) overlay.style.opacity = "0";
    setTimeout(beginGuide, 500);
  }, [beginGuide]);

  useEffect(() => {
    const flag = sessionStorage.getItem("flowtex-show-welcome");
    if (!flag) return;
    sessionStorage.removeItem("flowtex-show-welcome");
    // The flag is either "1" (start from the top, full logo intro) or a specific step id to
    // jump straight to — used by dev shortcuts to skip re-watching the whole intro each time.
    const stepId = flag === "1" ? STEPS[0].id : flag;
    startStepIdRef.current = stepId;
    if (stepId === STEPS[0].id) {
      setPhase("animation");
    } else {
      beginGuide();
    }
  }, [beginGuide]);

  const handleSkip = useCallback((skipTo: string) => {
    const target = STEPS.find((s) => s.id === skipTo);
    if (target) goTo(target, 350);
  }, [goTo]);

  const handleAdvance = useCallback(() => {
    if (step.kind === "chatbot") return; // driven by the "\" key instead
    if (step.kind === "interactive" && clientModalOpen) return; // let the real modal take over

    let navigated = false;
    if (step.kind === "sidebar") {
      setSidebarOnboarding(null);
      if (step.navigateTo) {
        router.push(step.navigateTo);
        navigated = true;
      }
    }

    if (isLastStep) {
      // Kanban demo cards shouldn't linger once the guide has moved past that page.
      emitKanbanGuideEvent({ type: "clear-demo-tasks" });
      setTimeout(() => setPhase("done"), navigated ? 500 : 0);
      return;
    }

    goTo(STEPS[stepIndex + 1], navigated ? 700 : 350);
  }, [step, stepIndex, isLastStep, clientModalOpen, router, goTo]);

  // Leaving the Kanban page for good — drop the illustration cards.
  useEffect(() => {
    if (step.id === "clients-sidebar") emitKanbanGuideEvent({ type: "clear-demo-tasks" });
  }, [step.id]);

  useEffect(() => {
    if (step.id !== "dash-calendar-select") return;
    const handler = () => handleAdvance();
    window.addEventListener("flowtex:dashboard-guide-calendars-saved", handler);
    return () => window.removeEventListener("flowtex:dashboard-guide-calendars-saved", handler);
  }, [step.id, handleAdvance]);

  // Advance once the user actually swaps the two medium-priority demo cards
  // (demo-2 and demo-3 start in that order — reversed means they were reordered).
  useEffect(() => {
    if (step.id !== "kanban-inprogress-demo") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type !== "demo-drag" || detail.columnId !== "in_progress") return;
      const order: string[] = detail.order;
      const iMedium1 = order.indexOf("demo-2");
      const iMedium2 = order.indexOf("demo-3");
      if (iMedium1 !== -1 && iMedium2 !== -1 && iMedium1 > iMedium2) handleAdvance();
    };
    window.addEventListener("flowtex:kanban-guide", handler);
    return () => window.removeEventListener("flowtex:kanban-guide", handler);
  }, [step.id, handleAdvance]);

  // Advance once the high-priority demo card is actually dropped into Done.
  useEffect(() => {
    if (step.id !== "kanban-drag-done") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type !== "demo-drag" || detail.columnId !== "done") return;
      const order: string[] = detail.order;
      if (order.includes("demo-1")) handleAdvance();
    };
    window.addEventListener("flowtex:kanban-guide", handler);
    return () => window.removeEventListener("flowtex:kanban-guide", handler);
  }, [step.id, handleAdvance]);

  // Auto-advance interactive steps once the real action they're narrating actually happens.
  useEffect(() => {
    if (step.id !== "kanban-task-create") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "task-created") handleAdvance();
    };
    window.addEventListener("flowtex:kanban-guide", handler);
    return () => window.removeEventListener("flowtex:kanban-guide", handler);
  }, [step.id, handleAdvance]);

  useEffect(() => {
    if (step.id !== "kanban-archived-button") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === "view-changed" && detail.view === "archived") handleAdvance();
    };
    window.addEventListener("flowtex:kanban-guide", handler);
    return () => window.removeEventListener("flowtex:kanban-guide", handler);
  }, [step.id, handleAdvance]);

  useEffect(() => {
    if (step.id !== "clients-create-do") return;
    const handler = () => handleAdvance();
    window.addEventListener("flowtex:clients-guide-client-created", handler);
    return () => window.removeEventListener("flowtex:clients-guide-client-created", handler);
  }, [step.id, handleAdvance]);

  // Step 6 (chatbot intro) is driven by the "\" key instead of a click, to mirror
  // the real shortcut used to open the assistant.
  useEffect(() => {
    if (phase !== "blur" || step.id !== "dash-chatbot") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "\\") return;
      e.preventDefault();

      if (chatSim === "hidden") {
        setVisible(false);
        setChatSim("input");
      } else if (chatSim === "shown") {
        setChatSim("hidden");
        const next = STEPS[stepIndex + 1];
        goTo(next, 350);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, step.id, chatSim, stepIndex, goTo]);

  // After the input bar appears, show the same loading dots as the real chat, then the reply.
  useEffect(() => {
    if (chatSim !== "input") return;
    const t = setTimeout(() => setChatSim("loading"), 500);
    return () => clearTimeout(t);
  }, [chatSim]);

  useEffect(() => {
    if (chatSim !== "loading") return;
    const t = setTimeout(() => setChatSim("shown"), 1200);
    return () => clearTimeout(t);
  }, [chatSim]);

  if (phase === "idle" || phase === "done") return null;

  // The client creation modal renders above everything — get out of its way entirely.
  if (phase === "blur" && step.id === "clients-create-do" && clientModalOpen) return null;

  const W = typeof window !== "undefined" ? window.innerWidth : 1920;
  const H = typeof window !== "undefined" ? window.innerHeight : 1080;
  const sr = step.kind === "fullscreen" || step.kind === "chatbot" ? null : rect;

  // The sidebar is a flush, rectangular panel — padding it like a card would
  // bleed the cutout's right edge into the dashboard, so it gets its own tighter values.
  const pad = step.kind === "sidebar" ? 0 : PAD;
  const radius = step.kind === "sidebar" ? 0 : RADIUS;

  // Lets a step extend the cutout further down than the element's real height — e.g. the
  // archived page is empty on first visit, so we show some blank space below it too.
  const extraBottomPad = ("extraBottomPad" in step && step.extraBottomPad) || 0;
  const boxHeight = sr ? sr.height + pad * 2 + extraBottomPad : 0;

  const clipPathId = "spotlight-clip";
  const clipD = sr
    ? `M 0 0 H ${W} V ${H} H 0 Z ` +
      roundedRectPath(sr.left - pad, sr.top - pad, sr.width + pad * 2, boxHeight, radius)
    : null;

  const textBelow = "textBelow" in step && step.textBelow;

  const sideStyle = sr
    ? textBelow
      ? {
          left: sr.left - pad,
          width: sr.width + pad * 2,
          textAlign: "center" as const,
        }
      : textSide === "right"
      ? {
          left: sr.right + pad + 24,
          width: Math.min(W - (sr.right + pad + 24) - 48, 560),
          textAlign: "left" as const,
        }
      : {
          right: W - (sr.left - pad) + 24,
          width: Math.min(sr.left - pad - 48, 560),
          textAlign: "right" as const,
        }
    : null;

  const isInteractive = step.kind === "interactive";
  const fullRelease = step.kind === "interactive" && step.fullRelease;
  const showSideText = (step.kind === "spotlight" || step.kind === "interactive" || step.kind === "sidebar") && sr && sideStyle;

  return (
    <>
      {/* Logo animation overlay */}
      {phase === "animation" && (
        <div
          ref={overlayRef}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "var(--color-bg)",
            opacity: 1, transition: "opacity 1s ease",
          }}
        >
          <LogoDrawAnimation onComplete={handleAnimationComplete} />
        </div>
      )}

      {/* SVG clip-path definition — used by non-interactive spotlight/sidebar steps below. */}
      {phase === "blur" && clipD && (
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
          <defs>
            <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
              <path clipRule="evenodd" d={clipD} />
            </clipPath>
          </defs>
        </svg>
      )}

      {/* Interactive steps with a measured hole: instead of relying on CSS clip-path for
          both the visuals AND letting clicks/drags through (which turned out unreliable —
          the dark tint would occasionally just fail to paint at all), build the dark frame
          out of four plain rectangles around the hole. Simple geometry, always works. */}
      {phase === "blur" && !fullRelease && isInteractive && sr && (() => {
        const holeLeft = sr.left - pad;
        const holeTop = sr.top - pad;
        const holeRight = holeLeft + sr.width + pad * 2;
        const holeBottom = holeTop + boxHeight;
        const strip = (style: CSSProperties, key: string) => (
          <div key={key} style={{
            position: "fixed",
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            opacity: overlayVisible ? 1 : 0,
            transition: "opacity 0.5s ease",
            zIndex: 9998,
            ...style,
          }} />
        );
        // The strips above meet at plain right angles, leaving a square notch at each of the
        // hole's 4 corners. Patch each notch with a radial-gradient quarter-circle so the
        // hole still reads as rounded, matching the accent border's radius.
        const r = Math.min(radius, sr.width / 2, boxHeight / 2);
        const corner = (pos: { left?: number; right?: number; top?: number; bottom?: number }, gradientCenter: string, key: string) => (
          <div key={key} style={{
            position: "fixed",
            width: r, height: r,
            background: `radial-gradient(circle at ${gradientCenter}, transparent ${r - 1}px, rgba(0,0,0,0.55) ${r}px)`,
            opacity: overlayVisible ? 1 : 0,
            transition: "opacity 0.5s ease",
            zIndex: 9998,
            ...pos,
          }} />
        );
        return (
          <>
            {strip({ left: 0, top: 0, width: "100vw", height: Math.max(holeTop, 0) }, "top")}
            {strip({ left: 0, top: holeBottom, width: "100vw", height: Math.max(H - holeBottom, 0) }, "bottom")}
            {strip({ left: 0, top: holeTop, width: Math.max(holeLeft, 0), height: holeBottom - holeTop }, "left")}
            {strip({ left: holeRight, top: holeTop, width: Math.max(W - holeRight, 0), height: holeBottom - holeTop }, "right")}
            {r > 0 && (
              <>
                {corner({ left: holeLeft, top: holeTop }, "100% 100%", "corner-tl")}
                {corner({ left: holeRight - r, top: holeTop }, "0% 100%", "corner-tr")}
                {corner({ left: holeLeft, top: holeBottom - r }, "100% 0%", "corner-bl")}
                {corner({ left: holeRight - r, top: holeBottom - r }, "0% 0%", "corner-br")}
              </>
            )}
          </>
        );
      })()}

      {/* Dark blur overlay — every other case: non-interactive steps (click-anywhere-to-continue,
          clip-path here works fine), plus "fullRelease"/interactive-without-a-rect-yet, which
          render nothing or a plain full-screen dim respectively. */}
      {phase === "blur" && !fullRelease && !(isInteractive && sr) && (
        <div
          onClick={!isInteractive && step.kind !== "chatbot" ? handleAdvance : undefined}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            opacity: overlayVisible ? 1 : 0, transition: "opacity 0.5s ease",
            cursor: !isInteractive && step.kind !== "chatbot" ? "pointer" : "default",
          }}
        >
          {/* Full-screen blur — shown when there's no spotlight cutout */}
          {!clipD && (
            <div style={{
              position: "absolute", inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }} />
          )}

          {/* Spotlight frame: blur+dark clipped to exclude the highlighted area. */}
          {clipD && (
            <div style={{
              position: "absolute", inset: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              clipPath: `url(#${clipPathId})`,
              WebkitClipPath: `url(#${clipPathId})`,
            }} />
          )}


          {/* Fullscreen text (dashboard/inbox intros) */}
          {step.kind === "fullscreen" && (
            <div
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(16px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
                pointerEvents: "none", textAlign: "center",
              }}
            >
              <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 600, color: "#fff", lineHeight: 1.15, marginBottom: "var(--space-4)" }}>
                {step.title}
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)" }}>{isLastStep ? "Click to finish" : "Click to continue"}</p>
            </div>
          )}

          {/* Chatbot step — intro text, full-screen, no cutout */}
          {step.kind === "chatbot" && chatSim === "hidden" && (
            <div
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                opacity: visible ? 1 : 0, transform: visible ? "translateY(0px)" : "translateY(16px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
                pointerEvents: "none", textAlign: "center",
              }}
            >
              <h2 style={{ fontSize: "var(--text-4xl)", fontWeight: 600, color: "#fff", lineHeight: 1.15, marginBottom: "var(--space-4)" }}>
                Meet your <Highlight>AI assistant</Highlight>
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)" }}>
                Press <span style={{ color: "#fff", fontWeight: 600 }}>\</span> to open it
              </p>
            </div>
          )}

          {/* Chatbot step — simulated chat window (static preview, not a real AI call) */}
          {step.kind === "chatbot" && chatSim !== "hidden" && (
            <div
              style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(680px, 90vw)",
                display: "flex", flexDirection: "column", alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  backgroundColor: "var(--color-bg-base)",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  pointerEvents: "none",
                }}
              >
                <AIInputWithSearch
                  placeholder="What would you like to do?"
                  minHeight={50}
                  maxHeight={150}
                  onSubmit={() => {}}
                />
              </div>

              {chatSim === "loading" && (
                <div className="flex justify-start" style={{ width: "100%", marginTop: "var(--space-4)" }}>
                  <div className="bg-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-base)]">
                    <div className="flex gap-[var(--space-1)]">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-100" />
                      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              {chatSim === "shown" && (
                <div style={{ width: "100%", marginTop: "var(--space-4)", opacity: 0, animation: "flowtex-fade-up 0.5s ease forwards" }}>
                  <div className="flex justify-start">
                    <div
                      className="bg-[var(--color-bg-base)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] max-w-2xl text-[length:var(--text-base)]"
                      style={{ border: "1px solid var(--color-border-subtle)" }}
                    >
                      <p style={{ marginBottom: "var(--space-3)" }}>
                        Hey! I&apos;m your Flowtex assistant. Here&apos;s a bit of what I can do:
                      </p>
                      <ul style={{ paddingLeft: 20, listStyle: "disc" }}>
                        {CHATBOT_SIM_BULLETS.map((bullet) => (
                          <li key={bullet} style={{ marginBottom: "var(--space-1)" }}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: "var(--space-4)" }}>
                    Press <span style={{ color: "#fff", fontWeight: 600 }}>\</span> to close
                  </p>
                </div>
              )}

              <style>{`
                @keyframes flowtex-fade-up {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>
          )}
        </div>
      )}

      {/* Accent border around the spotlight — rendered as a sibling of the (sometimes
          clipped) overlay above, since a clip-path on an ancestor would otherwise cut it. */}
      {phase === "blur" && sr && (
        <div style={{
          position: "fixed",
          left: sr.left - pad,
          top: sr.top - pad,
          width: sr.width + pad * 2,
          height: boxHeight,
          borderRadius: radius,
          border: "4px solid var(--color-accent)",
          pointerEvents: "none",
          zIndex: 9999,
        }} />
      )}

      {/* Spotlight / sidebar / interactive text — beside (or below) the highlighted element.
          Rendered as a sibling of the (sometimes clipped) overlay so it's never cut by it,
          and identical for every step kind — interactive steps included. */}
      {phase === "blur" && showSideText && (
        <div
          style={{
            position: "fixed",
            ...(textBelow
              ? {
                  top: sr!.top - pad + boxHeight + 24,
                  transform: visible ? "translateY(0px)" : "translateY(-8px)",
                }
              : {
                  top: Math.max(sr!.top - pad + boxHeight / 2, 220),
                  transform: visible ? "translateY(-50%) translateX(0px)" : "translateY(-50%) translateX(-8px)",
                }),
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease, transform 0.5s ease",
            pointerEvents: "none",
            zIndex: 9999,
            ...sideStyle,
          }}
        >
          <p style={{ fontSize: "var(--text-4xl)", fontWeight: 600, color: "#fff", lineHeight: 1.15 }}>
            {(step as SpotlightStep | InteractiveStep | SidebarStep).text}
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.5)", marginTop: "var(--space-4)", pointerEvents: "auto" }}>
            <span onClick={handleAdvance} style={{ cursor: "pointer" }}>
              {isLastStep ? "Click to finish" : "Click to continue"}
            </span>
            {"skipTo" in step && step.skipTo && (
              <>
                {" or "}
                <span
                  onClick={() => handleSkip(step.skipTo!)}
                  style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline", cursor: "pointer" }}
                >
                  skip step
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </>
  );
}
