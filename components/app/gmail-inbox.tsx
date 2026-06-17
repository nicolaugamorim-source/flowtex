"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppCache } from "@/lib/app-cache";
import { Skeleton } from "@/components/ui/skeleton";

interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  isUnread: boolean;
}

const SkeletonLoader = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-col gap-1 mb-3">
        <div className="flex justify-between">
          <Skeleton style={{ width: 120, height: 12, borderRadius: 4 }} />
          <Skeleton style={{ width: 40, height: 10, borderRadius: 4 }} />
        </div>
        <Skeleton style={{ width: "80%", height: 10, borderRadius: 4 }} />
      </div>
    ))}
  </div>
);

const MessageCard = ({ message, onEmailOpen }: { message: GmailMessage; onEmailOpen: (wasUnread: boolean) => void }) => {
  const router = useRouter();

  const handleClick = () => {
    if (message.isUnread) {
      onEmailOpen(true);
    }
    router.push(`/app/inbox?email=${message.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-bg-subtle)] transition-colors"
    >
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <p className={`truncate ${message.isUnread ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
          {message.sender}
        </p>
        <p className={`text-xs truncate ${message.isUnread ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>
          {message.subject}
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap flex-shrink-0">{message.date}</p>
    </div>
  );
};

export const GmailInbox = () => {
  const { cache, setCache, isStale } = useAppCache();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleEmailOpen = (wasUnread: boolean) => {
    if (wasUnread) {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem("flowtex_daily_reset_date");

      if (lastResetDate !== today) {
        localStorage.setItem("flowtex_emails_read_today", "0");
        localStorage.setItem("flowtex_daily_reset_date", today);
      }

      const count = parseInt(localStorage.getItem("flowtex_emails_read_today") || "0", 10);
      localStorage.setItem("flowtex_emails_read_today", (count + 1).toString());
    }
  };

  const fetchInbox = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first (2 min expiry)
      if (cache.dashboardEmails && !isStale("dashboardEmails", 2 * 60 * 1000)) {
        setMessages(cache.dashboardEmails.messages);
        setTotalUnread(cache.dashboardEmails.totalUnread);
        setGmailConnected(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/gmail/inbox");
      const data = await response.json();

      if (response.ok && data.messages) {
        setMessages(data.messages);
        setTotalUnread(data.totalUnread ?? 0);
        setCache("dashboardEmails", { messages: data.messages, totalUnread: data.totalUnread });
        setGmailConnected(true);
      } else if (data.error === "Gmail not connected") {
        setGmailConnected(false);
        setMessages([]);
        setTotalUnread(0);
      } else {
        setError(data.error || "Failed to load inbox");
        setMessages([]);
        setTotalUnread(0);
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
      setError("Failed to load inbox");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    try {
      const response = await fetch("/api/gmail/inbox");
      const data = await response.json();

      if (response.ok && data.messages) {
        setMessages(data.messages);
        setTotalUnread(data.totalUnread ?? 0);
        setCache("dashboardEmails", { messages: data.messages, totalUnread: data.totalUnread });
        setGmailConnected(true);
      } else if (data.error === "Gmail not connected") {
        setGmailConnected(false);
        setMessages([]);
        setTotalUnread(0);
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--color-text-primary)] text-xl font-semibold">New messages</h3>
        <button
          onClick={handleReload}
          disabled={isReloading}
          className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={20}
            className={`text-[var(--color-text-muted)] ${isReloading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div style={{ height: "320px" }} className="flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="overflow-y-auto flex-1">
            <SkeletonLoader />
          </div>
        ) : !gmailConnected ? (
          <div className="flex flex-col items-center justify-center text-center h-full p-4">
            <Mail className="w-8 h-8 text-[var(--color-text-muted)] mb-3" />
            <p className="text-[var(--color-text-muted)] text-sm mb-3">Gmail not connected</p>
            <Link href="/app/integrations" className="text-[var(--color-accent)] text-xs font-medium hover:underline">
              Connect Gmail
            </Link>
          </div>
        ) : (() => {
          const displayEmails = messages.slice(0, 4);
          const moreUnread = Math.max(0, totalUnread - displayEmails.length);

          return displayEmails.length > 0 ? (
            <div className="overflow-y-auto flex-1">
              <div className="flex flex-col gap-3">
                {displayEmails.map((message) => (
                  <MessageCard key={message.id} message={message} onEmailOpen={handleEmailOpen} />
                ))}
                {moreUnread > 0 && (
                  <Link href="/app/inbox" className="text-xs text-center text-[var(--color-text-muted)] mt-0 hover:underline font-medium">
                    +{moreUnread} more unread {moreUnread === 1 ? "email" : "emails"}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <p className="text-[var(--color-text-disabled)] text-sm">You're all caught up</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
