"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFullChatHistory } from "@/lib/database";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Message } from "@/lib/use-chat-bot";
import { useAICommand } from "@/lib/ai-command-context";

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

function formatDay(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatHistoryPage() {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { openWithMessages } = useAICommand();

  useEffect(() => {
    async function loadHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const history = await getFullChatHistory(user.id);
        setMessages(history);
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const query = search.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(query));
  }, [messages, search]);

  const groupedByDay = useMemo(() => {
    const groups = filteredMessages.reduce<Record<string, ChatMessageRow[]>>((acc, msg) => {
      const day = formatDay(msg.created_at);
      if (!acc[day]) acc[day] = [];
      acc[day].push(msg);
      return acc;
    }, {});

    // Most recent day first
    return Object.fromEntries(
      Object.entries(groups).sort(([, a], [, b]) => {
        const aLast = a[a.length - 1].created_at;
        const bLast = b[b.length - 1].created_at;
        return new Date(bLast).getTime() - new Date(aLast).getTime();
      })
    );
  }, [filteredMessages]);

  const openConversation = (dayMessages: ChatMessageRow[]) => {
    const seeded: Message[] = dayMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
    }));
    openWithMessages(seeded);
  };

  return (
    <div className="w-full bg-[var(--color-bg-card)] min-h-screen flex flex-col">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-5xl font-semibold text-[var(--color-text-primary)]">
            Chat History
          </h1>
        </div>

        {/* Search */}
        {!loading && messages.length > 0 && (
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] pl-9 pr-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]/50 transition-colors"
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-[var(--color-text-muted)]"
            >
              Loading conversations...
            </motion.div>
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              No conversations yet
            </p>
            <p className="text-xs text-[var(--color-text-muted)] max-w-xs">
              Press Ctrl+Alt anywhere in the app to open the AI assistant and start chatting.
            </p>
          </div>
        )}

        {/* No search results */}
        {!loading && messages.length > 0 && filteredMessages.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-12">
            No messages match "{search}".
          </p>
        )}

        {/* Day cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(groupedByDay).map(([day, dayMessages]) => {
            const lastMessage = dayMessages[dayMessages.length - 1];
            return (
              <button
                key={day}
                onClick={() => openConversation(dayMessages)}
                className="text-left rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-4 hover:border-[var(--color-accent)]/40 hover:shadow-sm transition-all"
              >
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  {day}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                  {lastMessage.content}
                </p>
                <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                  Last activity at {formatTime(lastMessage.created_at)}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
