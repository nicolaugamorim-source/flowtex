"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, Flame, AlertTriangle, CreditCard, Clock, XCircle } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, typeof Bell> = {
  integration_disconnected: AlertTriangle,
  streak_milestone: Flame,
  payment_failed: CreditCard,
  trial_ending: Clock,
  subscription_canceled: XCircle,
  cancellation_scheduled: XCircle,
};

// Where clicking a notification should take the user — the page where they'd
// actually act on it.
const TYPE_LINK: Record<string, string> = {
  integration_disconnected: "/app/integrations",
  streak_milestone: "/app",
  payment_failed: "/settings",
  trial_ending: "/settings",
  subscription_canceled: "/settings",
  cancellation_scheduled: "/settings",
};

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Fixed in the same spot on every page under app/app/layout.tsx (dashboard,
// kanban, inbox, clients, chat history, integrations), independent of the
// sidebar's own hover-to-expand behavior so it's always clickable without
// that side effect.
export function NotificationButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Kept mounted for one extra animation cycle after `open` flips to false, so
  // the panel can play its exit animation instead of just vanishing.
  const [rendered, setRendered] = useState(false);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Notifications stay visually unread for the whole time the panel is open —
  // only get marked read once it's closed, so a quick glance while open
  // doesn't instantly wipe the "new" indicator out from under the user.
  const wasOpenedRef = useRef(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling keeps the unread badge current even if the event that created a
    // notification (a webhook, a background refresh) happened while this tab
    // was already open — there's no push channel for this yet.
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      setRendered(true);
      wasOpenedRef.current = true;
      return;
    }
    if (wasOpenedRef.current) {
      wasOpenedRef.current = false;
      if (notifications.some((n) => !n.read)) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        fetch("/api/notifications/mark-read", { method: "POST" }).catch((error) =>
          console.error("Failed to mark notifications read:", error)
        );
      }
    }
    if (!rendered) return;
    const timeout = setTimeout(() => setRendered(false), 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleNotificationClick = (notification: Notification) => {
    setOpen(false);
    const href = TYPE_LINK[notification.type];
    if (href) router.push(href);
  };

  return (
    // top-right corner pinned here is shared by the button and the panel below,
    // so opening reads as the button itself expanding into the panel rather
    // than a separate popup appearing near it.
    <div ref={containerRef} className="fixed top-4 right-4 z-[25]">
      {rendered && (
        <div
          className={`${open ? "notif-panel-in" : "notif-panel-out"} absolute top-0 right-0 w-96 bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden flex flex-col`}
          style={{ transformOrigin: "top right", maxHeight: "28rem" }}
        >
          <div className="px-[var(--space-4)] pt-[var(--space-3)] pr-14 border-b border-[var(--color-border-default)] flex-shrink-0">
            <p className="text-[length:var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-[var(--space-2)]">Notifications</p>
            <div className="flex gap-[var(--space-4)]">
              {(["all", "unread"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative pb-[var(--space-2)] text-[length:var(--text-xs)] font-medium capitalize transition-colors"
                  style={{ color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                >
                  {t}
                  {tab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--color-accent)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="scrollbar-minimal overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="px-[var(--space-4)] py-[var(--space-12)] text-center">
                <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                  {tab === "unread" ? "No unread notifications" : "You're all caught up"}
                </p>
              </div>
            ) : (
              visibleNotifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type] ?? Bell;
                const clickable = Boolean(TYPE_LINK[notification.type]);
                return (
                  <div
                    key={notification.id}
                    onClick={clickable ? () => handleNotificationClick(notification) : undefined}
                    className={`relative flex gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--color-border-default)] last:border-b-0 transition-colors ${
                      clickable ? "cursor-pointer hover:bg-[var(--color-bg-secondary)]" : ""
                    }`}
                  >
                    {!notification.read && (
                      <span className="absolute top-4 left-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                    )}
                    <Icon size={16} className="mt-[2px] flex-shrink-0 text-[var(--color-text-muted)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-primary)]">{notification.title}</p>
                      <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)] mt-[2px]">{notification.message}</p>
                      <p className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] mt-[var(--space-1)]">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close notifications" : "Notifications"}
        className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-text-primary)] transition-all duration-200 ${
          open ? "border-2 border-transparent bg-transparent shadow-none" : "glass border-2"
        }`}
        style={open ? undefined : { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.3)" }}
      >
        <span className="relative block h-[18px] w-[18px]">
          <Bell
            size={18}
            className={`absolute inset-0 transition-all duration-200 ${open ? "rotate-45 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
          />
          <X
            size={18}
            className={`absolute inset-0 transition-all duration-200 ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-45 scale-75 opacity-0"}`}
          />
        </span>
        {!open && unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        )}
      </button>
    </div>
  );
}
