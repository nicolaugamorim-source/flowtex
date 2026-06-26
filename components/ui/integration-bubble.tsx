"use client";

import React, { useState } from "react";
import { DataBubble } from "@/components/ui/data-bubble";
import { EmailDraftBubble } from "@/components/ui/email-draft-bubble";
import type { BubbleData } from "@/lib/use-chat-bot";
import { Calendar, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IntegrationBubbleProps {
  bubble: BubbleData;
  sendMessage: (text: string, activeAction?: string | null, googleAccessToken?: string) => void;
  googleAccessToken?: string;
}

// Buttons reuse the same palette as the kanban columns/tags — no new colors, no teal.
const inputClass =
  "w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-border-strong)] transition-colors";

const secondaryBtn =
  "inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-secondary)] transition-all";

const primaryBtn =
  "inline-flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium text-white transition-all disabled:opacity-50";
const primaryBtnStyle = { backgroundColor: "var(--color-accent)" };

// A form panel that visually attaches to the bottom of the DataBubble above it
// (shares the border, no gap) so it reads as part of the same card.
const attachedPanel = "rounded-b-xl border border-t-0 border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-4 space-y-3 -mt-px";

export function IntegrationBubble({ bubble, sendMessage, googleAccessToken }: IntegrationBubbleProps) {
  if (bubble.type === "email_draft") {
    return <DraftEmailAction bubble={bubble} sendMessage={sendMessage} googleAccessToken={googleAccessToken} />;
  }

  if (bubble.type === "event") {
    return <EventAction bubble={bubble} sendMessage={sendMessage} />;
  }

  if (bubble.type === "email") {
    return <EmailAction bubble={bubble} sendMessage={sendMessage} googleAccessToken={googleAccessToken} />;
  }

  if (bubble.type === "notion" && !bubble.badge) {
    return <NotionSelectAction bubble={bubble} sendMessage={sendMessage} />;
  }

  return (
    <DataBubble
      type={bubble.type as any}
      title={bubble.title}
      subtitle={bubble.subtitle}
      description={bubble.description}
      metadata={bubble.metadata as any}
      badge={bubble.badge}
    />
  );
}

// ---------- Email draft: Confirm sends for real, Remake asks the assistant to redo it ----------
function DraftEmailAction({
  bubble,
  sendMessage,
  googleAccessToken,
}: {
  bubble: BubbleData;
  sendMessage: IntegrationBubbleProps["sendMessage"];
  googleAccessToken?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const to = bubble.meta?.to || bubble.subtitle || "";
  const subject = bubble.meta?.subject || bubble.title || "";
  const body = bubble.meta?.body || bubble.description || "";

  const handleConfirm = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, googleAccessToken }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const handleRemake = () => {
    sendMessage(`Rewrite the email draft to ${to} about "${subject}". Make it different.`);
  };

  if (status === "sent") {
    return (
      <div
        className="rounded-xl border px-4 py-3 text-sm"
        style={{
          borderColor: "var(--color-category-task-text)",
          backgroundColor: "var(--color-category-task-bg)",
          color: "var(--color-category-task-text)",
        }}
      >
        Email sent to {to}.
      </div>
    );
  }

  return (
    <div>
      <EmailDraftBubble
        to={to}
        subject={subject}
        body={body}
        onConfirm={handleConfirm}
        onRemake={handleRemake}
        isLoading={status === "sending"}
      />
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "var(--color-category-bug-text)" }}>
          Could not send the email. Try again.
        </p>
      )}
    </div>
  );
}

// ---------- Calendar event: Reschedule (inline date/time picker) + Delete ----------
function EventAction({
  bubble,
  sendMessage,
}: {
  bubble: BubbleData;
  sendMessage: IntegrationBubbleProps["sendMessage"];
}) {
  const [mode, setMode] = useState<"idle" | "reschedule" | "confirm-delete">("idle");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const isFinal = bubble.badge?.color === "error"; // already removed/cancelled

  const confirmReschedule = () => {
    if (!date) return;
    const timeRange = startTime && endTime ? `from ${startTime} to ${endTime}` : startTime ? `at ${startTime}` : "";
    sendMessage(`Reschedule "${bubble.title}" to ${date} ${timeRange}`.trim());
    setMode("idle");
  };

  const confirmDelete = () => {
    sendMessage(`Delete the event "${bubble.title}"`);
    setMode("idle");
  };

  const actions = isFinal
    ? []
    : mode === "confirm-delete"
      ? [
          { label: "Cancel", variant: "outline" as const, onClick: () => setMode("idle") },
          { label: "Confirm delete", variant: "danger" as const, onClick: confirmDelete },
        ]
      : [
          { label: "Reschedule", variant: "outline" as const, onClick: () => setMode("reschedule") },
          { label: "Delete", variant: "danger" as const, onClick: () => setMode("confirm-delete") },
        ];

  return (
    <div>
      <DataBubble
        type="event"
        title={bubble.title}
        subtitle={bubble.subtitle}
        description={bubble.description}
        metadata={bubble.metadata as any}
        badge={bubble.badge}
        actions={actions}
      />

      <AnimatePresence>
        {mode === "reschedule" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={attachedPanel}>
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                <Calendar className="w-4 h-4 text-[var(--color-category-client-text)]" />
                New date and time
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} placeholder="Start" />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} placeholder="End" />
              </div>
              <div className="flex gap-2 justify-end">
                <button className={secondaryBtn} onClick={() => setMode("idle")}>
                  Cancel
                </button>
                <button className={primaryBtn} style={primaryBtnStyle} onClick={confirmReschedule} disabled={!date}>
                  Confirm reschedule
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Email (read/found): Reply + Delete ----------
function EmailAction({
  bubble,
  sendMessage,
  googleAccessToken,
}: {
  bubble: BubbleData;
  sendMessage: IntegrationBubbleProps["sendMessage"];
  googleAccessToken?: string;
}) {
  const [mode, setMode] = useState<"idle" | "reply" | "confirm-delete">("idle");
  const [replyText, setReplyText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "deleting" | "deleted">("idle");

  const fromEmail = bubble.meta?.fromEmail;
  const emailId = bubble.meta?.emailId;
  const subject = bubble.meta?.subject || bubble.title;

  const sendReply = async () => {
    if (!fromEmail || !replyText.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: fromEmail,
          subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
          body: replyText,
          googleAccessToken,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setMode("idle");
    } catch {
      setStatus("error");
    }
  };

  const confirmDelete = async () => {
    if (!emailId) return;
    setStatus("deleting");
    try {
      const res = await fetch("/api/gmail/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: emailId }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("deleted");
    } catch {
      setStatus("error");
    }
    setMode("idle");
  };

  if (status === "deleted") {
    return (
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        Email deleted.
      </div>
    );
  }

  const actions =
    mode === "confirm-delete"
      ? [
          { label: "Cancel", variant: "outline" as const, onClick: () => setMode("idle") },
          {
            label: status === "deleting" ? "Deleting..." : "Confirm delete",
            variant: "danger" as const,
            onClick: confirmDelete,
          },
        ]
      : [
          ...(fromEmail ? [{ label: "Reply", variant: "outline" as const, onClick: () => setMode("reply") }] : []),
          ...(emailId ? [{ label: "Delete", variant: "danger" as const, onClick: () => setMode("confirm-delete") }] : []),
        ];

  return (
    <div>
      <DataBubble
        type="email"
        title={bubble.title}
        subtitle={bubble.subtitle}
        description={bubble.description}
        metadata={bubble.metadata as any}
        badge={bubble.badge}
        actions={actions}
      />

      {status === "sent" && (
        <p className="text-xs mt-2" style={{ color: "var(--color-category-task-text)" }}>
          Reply sent.
        </p>
      )}
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "var(--color-category-bug-text)" }}>
          Something went wrong. Try again.
        </p>
      )}

      <AnimatePresence>
        {mode === "reply" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={attachedPanel}>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Reply to {fromEmail}</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Write your reply..."
                className={inputClass}
              />
              <div className="flex gap-2 justify-end">
                <button className={secondaryBtn} onClick={() => setMode("idle")}>
                  Cancel
                </button>
                <button className={primaryBtn} style={primaryBtnStyle} onClick={sendReply} disabled={!replyText.trim() || status === "sending"}>
                  <Send className="w-3.5 h-3.5" />
                  {status === "sending" ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Notion: pick one of several search results ----------
function NotionSelectAction({
  bubble,
  sendMessage,
}: {
  bubble: BubbleData;
  sendMessage: IntegrationBubbleProps["sendMessage"];
}) {
  const [selected, setSelected] = useState(false);

  return (
    <DataBubble
      type="notion"
      title={bubble.title}
      subtitle={bubble.subtitle}
      description={bubble.description}
      actions={
        selected
          ? []
          : [
              {
                label: "Use this page",
                variant: "outline",
                onClick: () => {
                  setSelected(true);
                  sendMessage(`Use the page "${bubble.title}"`);
                },
              },
            ]
      }
    />
  );
}
