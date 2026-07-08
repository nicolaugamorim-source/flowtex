"use client";

// Gmail inbox view inside the app — list, read, mark-read and delete emails.
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Search, Circle, ChevronLeft, Trash2 } from "lucide-react";
import { useAppCache } from "@/lib/app-cache";
import { useToast } from "@/components/ui/toast-provider";
import { classifyError } from "@/lib/error-messages";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";

interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  date: string;
  isUnread: boolean;
}

interface EmailDetail {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  isUnread: boolean;
  mimeType: string;
}

// Mirrors EmailListItem exactly: px-4 py-3 row, border-l-4 (transparent since
// no row is selected while loading), dot column, sender/date row + subject row.
const EmailListSkeleton = () => (
  <div className="animate-pulse">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--color-border-subtle)] border-l-4 border-l-transparent flex items-start gap-[var(--space-3)]"
      >
        <div className="w-2 self-center flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-[var(--color-bg-elevated)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-[var(--space-2)] mb-[var(--space-1)]">
            <div className="h-3.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ width: "40%" }} />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] flex-shrink-0" style={{ width: 48 }} />
          </div>
          <div className="h-3.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)]" style={{ width: "70%" }} />
        </div>
        <div className="flex-shrink-0 self-center" style={{ width: 16, height: 16 }} />
      </div>
    ))}
  </div>
);

// Mirrors the body pane only (p-8, max-w-none) — the header above it (subject/
// from/to/date) is real markup rendered outside this skeleton's branch.
const EmailDetailSkeleton = () => (
  <div className="max-w-none animate-pulse space-y-[var(--space-3)]">
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-11/12" />
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-3/4" />
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
    <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-5/6" />
  </div>
);

// Renders email HTML inside a sandboxed iframe so the email's own styles
// (inline <style> tags, broad selectors like body/table/p) can never leak
// out and affect the rest of the app's layout.
const EmailHtmlFrame = ({ html }: { html: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  const resize = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc?.body) {
        setHeight(doc.body.scrollHeight + 24);
      }
    } catch {
      // Cross-origin content (e.g. a redirect inside the iframe) — keep the current height.
    }
  }, []);

  const srcDoc = `<!DOCTYPE html><html><head><base target="_blank" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0D1F2D; word-wrap: break-word; }
      img, table { max-width: 100% !important; height: auto !important; }
      a { color: #00A882; }
    </style>
  </head><body>${html}</body></html>`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      onLoad={resize}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      className="w-full border-0"
      style={{ height }}
      title="Email content"
    />
  );
};

const EmailListItem = ({
  email,
  isSelected,
  onClick,
  onRequestDelete,
}: {
  email: GmailMessage;
  isSelected: boolean;
  onClick: () => void;
  onRequestDelete: (email: GmailMessage) => void;
}) => {
  const [trashHovered, setTrashHovered] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    if (date.toDateString() === today.toDateString()) {
      return time;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${time}`;
    } else {
      const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${dateStr} ${time}`;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group px-[var(--space-4)] py-[var(--space-3)] border-b border-[var(--color-border-subtle)] cursor-pointer transition-all flex items-start gap-[var(--space-3)] ${
        isSelected
          ? "border-l-4 border-l-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
          : "border-l-4 border-l-transparent hover:bg-[var(--color-bg-base)]"
      }`}
    >
      {/* Unread dot — centred against the whole card's height, not just one line. */}
      <div className="w-2 self-center flex items-center justify-center flex-shrink-0">
        {email.isUnread && (
          <Circle size={8} className="text-[var(--color-accent)] fill-current" />
        )}
      </div>

      {/* Email content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-[var(--space-2)] mb-[var(--space-1)]">
          <p className={`text-[length:var(--text-sm)] ${email.isUnread ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]"}`}>
            {email.sender}
          </p>
          <span className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] flex-shrink-0">{formatDate(email.date)}</span>
        </div>
        <p
          className={`text-[length:var(--text-sm)] truncate ${
            email.isUnread ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-primary)]"
          }`}
        >
          {email.subject}
        </p>
      </div>

      {/* Trash icon - visible on row hover */}
      <button
        data-trash-button="true"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(email);
        }}
        onMouseEnter={() => setTrashHovered(true)}
        onMouseLeave={() => setTrashHovered(false)}
        className="flex-shrink-0 self-center px-[var(--space-2)] py-[var(--space-1)] rounded-full transition-colors text-[length:var(--text-xs)] font-medium"
        style={{
          color: trashHovered ? "var(--color-error)" : "var(--color-text-disabled)",
          backgroundColor: trashHovered ? "var(--color-delete-hover-bg)" : "transparent",
          cursor: "pointer",
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// Gmail inbox view inside the app — lists/reads/marks-read/deletes emails
// via the Gmail API, with local caching to avoid refetching on every visit.
export default function InboxPage() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const { cache, setCache, isStale } = useAppCache();
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");
  const [gmailConnected, setGmailConnected] = useState(true);
  const [emailPendingDelete, setEmailPendingDelete] = useState<GmailMessage | null>(null);

  useEffect(() => {
    // Check if we have valid cache with 25 emails (allEmails, not dashboard's 4)
    if (cache.allInboxEmails && cache.allInboxEmails.length >= 25 && !isStale("allInboxEmails", 3 * 60 * 1000)) {
      setEmails(cache.allInboxEmails);
      setGmailConnected(true);
      setIsLoadingList(false);
      return;
    }

    // No valid cache with 25 emails, fetch fresh from /all endpoint
    fetchEmails();
  }, []);

  // Check if email ID is in query params and auto-expand it
  useEffect(() => {
    const emailId = searchParams.get("email");
    if (emailId && emails.length > 0) {
      const email = emails.find((e) => e.id === emailId);
      if (email) {
        handleSelectEmail(email);
      }
    }
  }, [searchParams, emails]);

  // Lets the onboarding guide open the first email so it has something real to spotlight.
  useEffect(() => {
    const handler = () => {
      if (emails.length > 0 && !selectedEmail) handleSelectEmail(emails[0]);
    };
    window.addEventListener("flowtex:inbox-guide-select-first", handler);
    return () => window.removeEventListener("flowtex:inbox-guide-select-first", handler);
  }, [emails, selectedEmail]);

  const fetchEmails = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch("/api/gmail/inbox/all");
      const data = await response.json();
      if (data.error === "Gmail not connected") {
        setGmailConnected(false);
      } else if (data.messages) {
        setEmails(data.messages);
        setCache("allInboxEmails", data.messages);
        setGmailConnected(true);
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
      setGmailConnected(false);
    } finally {
      setIsLoadingList(false);
    }
  };

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      const matchesSearch =
        searchQuery === "" ||
        email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "unread"
          ? email.isUnread
          : !email.isUnread;

      return matchesSearch && matchesFilter;
    });
  }, [emails, searchQuery, activeFilter]);

  const handleSelectEmail = async (email: GmailMessage) => {
    setSelectedEmail(email as any);
    setIsLoadingDetail(true);

    // Mark as read IMMEDIATELY if unread
    if (email.isUnread) {
      // Optimistic update: mark as read locally immediately
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isUnread: false } : e))
      );

      // Call API to mark as read in Gmail
      try {
        console.log("[INBOX] Marking email as read:", email.id);
        const response = await fetch("/api/gmail/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: email.id }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error(
            "[INBOX] Failed to mark as read:",
            response.status,
            data
          );
        } else {
          console.log("[INBOX] Marked as read in Gmail:", email.id);
        }
      } catch (err) {
        console.error("[INBOX] Mark as read error:", err);
      }
    }

    // Fetch full email details
    try {
      const response = await fetch(`/api/gmail/message/${email.id}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedEmail(data);
      }
    } catch (err) {
      console.error("Failed to fetch email details:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Awaited by the delete confirmation modal, which already shows its own
  // loading/success state — so this only mutates local state once Gmail has
  // actually confirmed the delete, instead of the old optimistic-then-rollback dance.
  const handleDeleteEmail = async (emailId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/gmail/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: emailId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("[INBOX] Failed to delete email:", data);
        toast.show({
          ...classifyError(Object.assign(new Error("Failed to delete email"), { status: response.status }), "Email", "deleted"),
          onRetry: () => handleDeleteEmail(emailId),
        });
        return false;
      }

      console.log("[INBOX] Deleted email from Gmail:", emailId);
      const updatedEmails = emails.filter((e) => e.id !== emailId);
      setEmails(updatedEmails);
      setCache("allInboxEmails", updatedEmails);
      if (selectedEmail?.id === emailId) setSelectedEmail(null);
      return true;
    } catch (err) {
      console.error("[INBOX] Delete email error:", err);
      toast.show({
        ...classifyError(err, "Email", "deleted"),
        onRetry: () => handleDeleteEmail(emailId),
      });
      return false;
    }
  };

  if (!gmailConnected) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-[var(--color-bg-base)] p-[var(--space-8)]">
        <Link href="/app" className="flex items-center gap-[var(--space-2)] text-[var(--color-accent)] mb-[var(--space-8)]">
          <ChevronLeft size={20} /> Back to dashboard
        </Link>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Mail size={48} className="mx-auto mb-[var(--space-4)] text-[var(--color-text-disabled)]" />
            <h2 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-[var(--space-2)]">Gmail not connected</h2>
            <p className="text-[var(--color-text-disabled)] mb-[var(--space-6)]">Connect Gmail in integrations to view your inbox</p>
            <a href="/app/integrations" className="text-[var(--color-accent)] hover:underline">
              Go to Integrations
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--color-bg-base)]">
      <div className="flex h-screen flex-col">
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-[var(--space-4)]">
          <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-primary)]">Inbox</h1>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Email List — hidden on small screens once an email is open, so the
              detail view gets the full width there instead of squeezing both panels. */}
          <div
            data-onboarding="inbox-list"
            className={`${selectedEmail ? "hidden md:flex" : "flex"} w-full md:w-[35%] border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] flex-col`}
          >
            {/* Search Bar */}
            <div className="p-[var(--space-4)] border-b border-[var(--color-border-subtle)]">
              <div className="relative mb-[var(--space-3)]">
                <Search className="absolute left-3 top-3 text-[var(--color-text-disabled)]" size={18} />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-[var(--space-10)] pr-[var(--space-4)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-[var(--space-2)]">
                {(["all", "unread", "read"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-[var(--space-3)] py-[var(--space-1)] rounded-full text-[length:var(--text-xs)] font-medium transition-colors ${
                      activeFilter === filter
                        ? "bg-[var(--color-accent)] text-[var(--color-bg-base)] font-medium"
                        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)]"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Read"}
                  </button>
                ))}
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingList ? (
                <EmailListSkeleton />
              ) : filteredEmails.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[var(--color-text-disabled)]">
                    {emails.length === 0 ? "Your inbox is empty" : "No emails matching your search"}
                  </p>
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => handleSelectEmail(email)}
                    onRequestDelete={setEmailPendingDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Email Detail — the only panel shown on small screens once an
              email is selected; a "Back" button there returns to the list. */}
          <div
            data-onboarding="inbox-expanded"
            className={`${selectedEmail ? "flex" : "hidden md:flex"} flex-1 bg-[var(--color-bg-base)] flex-col`}
          >
            {selectedEmail ? (
              <>
                <div className="border-b border-[var(--color-border-subtle)] p-[var(--space-8)] space-y-[var(--space-4)]">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="md:hidden flex items-center gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-[var(--space-2)]"
                  >
                    <ChevronLeft size={16} /> Back to inbox
                  </button>
                  <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-primary)] leading-tight">
                    {selectedEmail.subject}
                  </h1>
                  <div className="space-y-[var(--space-2)] text-[var(--color-text-disabled)]">
                    <p>
                      <span className="font-semibold">From:</span> {selectedEmail.from}
                    </p>
                    <p>
                      <span className="font-semibold">To:</span> {selectedEmail.to}
                    </p>
                    <p>
                      <span className="font-semibold">Date:</span>{" "}
                      {new Date(selectedEmail.date).toLocaleString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-[var(--space-8)]">
                  {isLoadingDetail ? (
                    <EmailDetailSkeleton />
                  ) : (
                    <div className="max-w-none">
                      {selectedEmail.mimeType === "text/html" ? (
                        <EmailHtmlFrame html={selectedEmail.body} />
                      ) : (
                        <p className="text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
                          {selectedEmail.body}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Mail size={48} className="text-[var(--color-border-default)] mb-[var(--space-4)]" />
                <p className="text-[var(--color-text-disabled)]">Select an email to read</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!emailPendingDelete}
        onClose={() => setEmailPendingDelete(null)}
        onConfirm={() => handleDeleteEmail(emailPendingDelete!.id)}
        title="Delete email?"
        description={`"${emailPendingDelete?.subject ?? ""}" will be permanently deleted from Gmail. This can't be undone.`}
        successMessage="Email deleted"
      />
    </div>
  );
}
