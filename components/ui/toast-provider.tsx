"use client";

// Global toast system for surfacing failed background actions (a task that
// didn't save, a client that didn't update) instead of failing silently.
// Mounted once in the root layout; call `useToast()` from anywhere.
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { X, WifiOff, ServerCrash, Clock, LogOut, TriangleAlert } from "lucide-react";
import type { ClassifiedError } from "@/lib/error-messages";

interface Toast extends ClassifiedError {
  id: number;
  tone: "error" | "warning";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onRetry?: () => void;
  leaving: boolean;
}

interface ShowToastOptions extends ClassifiedError {
  tone?: "error" | "warning";
  icon?: Toast["icon"];
  onRetry?: () => void;
}

interface ToastContextValue {
  show: (options: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const DISPLAY_DURATION_MS = 6000;
// Must match the slide-out transition length below — the toast is removed
// from the DOM only after this, so the exit animation gets to finish first.
const EXIT_DURATION_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const displayTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const exitTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    exitTimers.current.delete(id);
  }, []);

  // Starts the slide-down-and-fade exit, then removes the toast once it's done.
  const dismiss = useCallback(
    (id: number) => {
      const displayTimer = displayTimers.current.get(id);
      if (displayTimer) {
        clearTimeout(displayTimer);
        displayTimers.current.delete(id);
      }
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      exitTimers.current.set(id, setTimeout(() => remove(id), EXIT_DURATION_MS));
    },
    [remove]
  );

  const show = useCallback(
    ({ tone = "error", icon, onRetry, ...rest }: ShowToastOptions) => {
      const id = nextId.current++;
      const toast: Toast = { id, tone, icon: icon ?? TriangleAlert, onRetry, leaving: false, ...rest };
      setToasts((prev) => [...prev, toast]);
      displayTimers.current.set(
        id,
        setTimeout(() => dismiss(id), DISPLAY_DURATION_MS)
      );
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = toast.icon;
  const accentVar = toast.tone === "error" ? "--color-error" : "--color-warning";
  const accentBgVar = toast.tone === "error" ? "--color-error-bg" : "--color-warning-bg";

  return (
    <div
      role="alert"
      className={
        "flex items-start gap-3 rounded-[var(--radius-lg)] border p-[var(--space-4)] shadow-lg " +
        (toast.leaving ? "toast-slide-out" : "toast-slide-in")
      }
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderColor: "var(--color-border-default)",
      }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `var(${accentBgVar})`, color: `var(${accentVar})` }}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)]">{toast.title}</p>
        <p className="mt-0.5 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">{toast.message}</p>
        {toast.onRetry && (
          <button
            onClick={() => {
              toast.onRetry?.();
              onDismiss();
            }}
            className="mt-2 text-[length:var(--text-xs)] font-medium hover:underline"
            style={{ color: `var(${accentVar})` }}
          >
            Try again
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-[var(--color-icon)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Icons matched to each error-message category, for callers that want the
// visual to match without importing lucide-react themselves.
export const TOAST_ICONS = {
  offline: WifiOff,
  "connection-lost": WifiOff,
  server: ServerCrash,
  auth: LogOut,
  timeout: Clock,
  generic: TriangleAlert,
} as const;
