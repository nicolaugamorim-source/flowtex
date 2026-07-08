"use client";

// Shows the user's past AI chat conversations with search/filter over the history.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFullChatHistory } from "@/lib/database";
import { Search, Sparkles } from "lucide-react";
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

// Lists the user's past AI chat messages, grouped by day, with search.
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
    <div className="w-full bg-[var(--color-bg-card)] min-h-screen flex flex-col overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto" style={{ paddingLeft: "var(--space-4)", paddingRight: "var(--space-4)", paddingTop: "var(--space-8)", paddingBottom: "var(--space-8)" }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: "var(--space-6)" }}>
          <h1 className="text-[var(--color-text-primary)]" style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--font-semibold)" }}>
            Chat History
          </h1>
        </div>

        {/* Search */}
        {!loading && messages.length > 0 && (
          <div className="relative" style={{ marginBottom: "var(--space-8)" }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="w-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]/50 transition-colors"
              style={{ borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", paddingLeft: "var(--space-8)", paddingRight: "var(--space-3)", paddingTop: "var(--space-2)", paddingBottom: "var(--space-2)" }}
            />
          </div>
        )}

        {/* Loading state — structural clone of the day-card grid below */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-pulse" style={{ gap: "var(--space-3)" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]"
                style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}
              >
                <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ height: "var(--text-sm)", width: "40%", marginBottom: "var(--space-2)" }} />
                <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ height: "var(--text-xs)", width: "100%", marginBottom: "var(--space-1)" }} />
                <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ height: "var(--text-xs)", width: "70%", marginBottom: "var(--space-2)" }} />
                <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ height: "var(--text-xs)", width: "50%" }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center" style={{ gap: "var(--space-3)", paddingTop: "var(--space-16)", paddingBottom: "var(--space-16)" }}>
            <div className="h-12 w-12 flex items-center justify-center bg-[var(--color-accent-subtle)]" style={{ borderRadius: "var(--radius-full)" }}>
              <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <p className="text-[var(--color-text-primary)]" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
              No conversations yet
            </p>
            <p className="text-[var(--color-text-muted)] max-w-xs" style={{ fontSize: "var(--text-xs)" }}>
              Press \ anywhere in the app to open the AI assistant and start chatting.
            </p>
          </div>
        )}

        {/* No search results */}
        {!loading && messages.length > 0 && filteredMessages.length === 0 && (
          <p className="text-[var(--color-text-muted)] text-center" style={{ fontSize: "var(--text-sm)", paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}>
            No messages match "{search}".
          </p>
        )}

        {/* Day cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "var(--space-3)" }}>
          {Object.entries(groupedByDay).map(([day, dayMessages]) => {
            const lastMessage = dayMessages[dayMessages.length - 1];
            return (
              <button
                key={day}
                onClick={() => openConversation(dayMessages)}
                className="text-left border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] hover:border-[var(--color-accent)]/40 hover:shadow-sm transition-all"
                style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}
              >
                <p className="text-[var(--color-text-primary)]" style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>
                  {day}
                </p>
                <p className="text-[var(--color-text-muted)] line-clamp-2" style={{ fontSize: "var(--text-xs)" }}>
                  {lastMessage.content}
                </p>
                <p className="text-[var(--color-text-muted)]" style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-2)" }}>
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
