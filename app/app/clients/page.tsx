"use client";

// CRM-style clients page — list, create, edit and view per-client emails/meetings.
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Plus, Search, Trash2, Edit2, Mail, Calendar, FileText, Users, X, Sparkles, RefreshCw, ChevronLeft } from "lucide-react";
import { useGoogle } from "@/lib/google-context";
import { useToast } from "@/components/ui/toast-provider";
import { classifyError } from "@/lib/error-messages";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: "active" | "lead" | "inactive";
  notes?: string;
  avatar_color: string;
  avatar_url?: string | null;
  ai_insight?: string | null;
  ai_insight_generated_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface Meeting {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: number;
}

interface EmailDetail {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  mimeType: string;
}

// Renders email HTML inside a sandboxed iframe so the email's own styles
// can never leak out and affect the rest of the app's layout.
const EmailHtmlFrame = ({ html }: { html: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(150);

  const resize = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc?.body) {
        setHeight(doc.body.scrollHeight + 24);
      }
    } catch {
      // Cross-origin content — keep the current height.
    }
  }, []);

  const srcDoc = `<!DOCTYPE html><html><head><base target="_blank" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0D1F2D; background: transparent; word-wrap: break-word; }
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

// Full-email viewer modal — same dark blurred backdrop as the AI chat assistant,
// with the email itself shown as a dark blue "bubble" card.
const EmailDetailModal = ({
  email,
  isLoading,
  onClose,
}: {
  email: EmailDetail | null;
  isLoading: boolean;
  onClose: () => void;
}) => {
  if (!email && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[var(--space-4)]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-[var(--space-1)] rounded-full text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <X size={18} />
        </button>

        {isLoading || !email ? (
          <div className="p-[var(--space-8)] animate-pulse space-y-[var(--space-4)]">
            <div className="h-6 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-2/3" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-1/2" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full mt-[var(--space-6)]" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-3/4" />
          </div>
        ) : (
          <div className="p-[var(--space-6)]">
            <div className="flex items-start gap-[var(--space-3)] mb-[var(--space-4)]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-info-bg)] text-[var(--color-info)] flex-shrink-0">
                <Mail size={18} />
              </div>
              <div className="flex-1 min-w-0 pr-[var(--space-6)]">
                <h3 className="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)] leading-snug">{email.subject}</h3>
                <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)] mt-[var(--space-1)]">{email.from}</p>
                <p className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] mt-[var(--space-1)]">
                  {email.date ? new Date(email.date).toLocaleString() : ""}
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] p-[var(--space-4)]">
              {email.mimeType === "text/html" ? (
                <EmailHtmlFrame html={email.body} />
              ) : (
                <p className="text-[length:var(--text-sm)] text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">{email.body}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AVATAR_COLORS = ["#00D4A4", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#22C55E"];
const STATUS_OPTIONS: Array<"active" | "lead" | "inactive"> = ["active", "lead", "inactive"];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Shows the contact's real profile picture (via Gravatar, looked up from their email)
// when one exists; falls back to the colored initials circle otherwise — including
// when the image fails to load (e.g. Gravatar 404s because the email has no avatar set).
const ClientAvatar = ({
  client,
  size = "clamp(32px, 3vw, 40px)",
  textSize = "text-[length:var(--text-sm)]",
}: {
  client: Client;
  size?: number | string;
  textSize?: string;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!client.avatar_url && !imageFailed;

  if (showImage) {
    return (
      <img
        src={client.avatar_url!}
        onError={() => setImageFailed(true)}
        alt={client.name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${textSize}`}
      style={{ width: size, height: size, backgroundColor: client.avatar_color }}
    >
      {getInitials(client.name)}
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return { bg: "var(--color-accent-subtle)", text: "var(--color-accent-pressed)" };
    case "lead":
      return { bg: "var(--color-warning-bg)", text: "var(--color-warning)" };
    case "inactive":
      return { bg: "var(--color-bg-card)", text: "var(--color-text-disabled)" };
    default:
      return { bg: "var(--color-bg-card)", text: "var(--color-text-disabled)" };
  }
};

// Mirrors ClientCard exactly: p-4, rounded-lg, border-l-4 (transparent — no
// row is selected while loading), avatar circle, name + status pill, "Last
// contact" text block on the right.
const ClientSkeleton = () => (
  <div className="animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="p-[var(--space-4)] rounded-[var(--radius-lg)] border-l-4 border-l-transparent mb-[var(--space-2)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <div className="rounded-full bg-[var(--color-bg-card)] flex-shrink-0" style={{ width: "clamp(40px, 4vw, 56px)", height: "clamp(40px, 4vw, 56px)" }} />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-[var(--color-bg-card)] rounded-[var(--radius-sm)]" style={{ width: "45%" }} />
            <div className="mt-[var(--space-2)] h-5 w-16 rounded-full bg-[var(--color-bg-elevated)]" />
          </div>
          <div className="flex-shrink-0" style={{ width: 64 }}>
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full mb-[var(--space-1)]" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-2/3 ml-auto" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Mirrors the emails-tab row: p-3, rounded-lg, border, subject/from/snippet
// stacked left, date on the right.
const EmailRowSkeleton = () => (
  <div className="animate-pulse space-y-[var(--space-3)]">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-3.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-2/3 mb-[var(--space-1)]" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-1/3 mb-[var(--space-1)]" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
          </div>
          <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] flex-shrink-0 ml-[var(--space-2)]" style={{ width: 56 }} />
        </div>
      </div>
    ))}
  </div>
);

// Mirrors the meetings-tab row: p-3, rounded-lg, border, title + date/time stacked.
const MeetingRowSkeleton = () => (
  <div className="animate-pulse space-y-[var(--space-3)]">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
        <div className="h-3.5 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-1/2 mb-[var(--space-1)]" />
        <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-1/3" />
      </div>
    ))}
  </div>
);

const EMPTY_CLIENT_FORM = {
  name: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  status: "active" as "active" | "lead" | "inactive",
  notes: "",
  avatar_color: "#00D4A4",
};

const ClientFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: typeof EMPTY_CLIENT_FORM) => void;
  initialData?: Client | null;
  isSubmitting?: boolean;
}) => {
  const isEditing = !!initialData;
  const [form, setForm] = useState<typeof EMPTY_CLIENT_FORM>(EMPTY_CLIENT_FORM);

  // Reset the form whenever the modal opens, either blank (add) or pre-filled (edit).
  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              name: initialData.name,
              company: initialData.company || "",
              email: initialData.email || "",
              phone: initialData.phone || "",
              website: initialData.website || "",
              status: initialData.status,
              notes: initialData.notes || "",
              avatar_color: initialData.avatar_color,
            }
          : EMPTY_CLIENT_FORM
      );
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-[var(--space-4)]">
      <div className="bg-[var(--color-bg-card)] rounded-[var(--radius-xl)] p-[var(--space-6)] max-w-[clamp(400px,40vw,520px)] w-full border border-[var(--color-border-default)]">
        <div className="flex items-center justify-between mb-[var(--space-6)]">
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{isEditing ? "Edit Client" : "Add Client"}</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-[var(--space-4)]">
          <input
            type="text"
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="text"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="url"
            placeholder="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <div>
            <label className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)] block mb-[var(--space-2)]">Status</label>
            <div className="flex gap-[var(--space-2)]">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => setForm({ ...form, status })}
                  className={`px-[var(--space-3)] py-[var(--space-1)] rounded-full text-[length:var(--text-xs)] font-medium transition-colors ${
                    form.status === status
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-muted)] block mb-[var(--space-2)]">Avatar Color</label>
            <div className="flex gap-[var(--space-2)]">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, avatar_color: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.avatar_color === color
                      ? "border-[var(--color-accent)] scale-110"
                      : "border-[var(--color-border-default)]"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-[var(--space-3)] py-[var(--space-2)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] resize-none h-20"
          />
        </div>

        <div className="flex gap-[var(--space-2)] mt-[var(--space-6)]">
          <button
            onClick={onClose}
            className="flex-1 px-[var(--space-4)] py-[var(--space-2)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-base)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || isSubmitting}
            className="flex-1 px-[var(--space-4)] py-[var(--space-2)] bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientCard = ({
  client,
  isSelected,
  onClick,
  lastContactDays,
}: {
  client: Client;
  isSelected: boolean;
  onClick: () => void;
  lastContactDays: number | null | undefined;
}) => {
  const statusColors = getStatusColor(client.status);

  return (
    <div
      onClick={onClick}
      className={`p-[var(--space-4)] rounded-[var(--radius-lg)] border-l-4 cursor-pointer transition-all mb-[var(--space-2)] ${
        isSelected
          ? "border-l-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
          : "border-l-transparent hover:bg-[var(--color-bg-secondary)]"
      }`}
    >
      <div className="flex items-center gap-[var(--space-3)]">
        <ClientAvatar client={client} size="clamp(40px, 4vw, 56px)" textSize="text-[length:var(--text-lg)]" />

        <div className="flex-1 min-w-0">
          <p className="truncate">
            <span className="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)]">{client.name}</span>
            {client.company && (
              <span className="text-[length:var(--text-base)] font-normal text-[var(--color-text-muted)]"> | {client.company}</span>
            )}
          </p>

          <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-2)]">
            <span
              className="px-[var(--space-2)] py-[var(--space-1)] rounded-full text-[length:var(--text-xs)] font-medium"
              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
            >
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </span>
          </div>
        </div>

        <p className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] flex-shrink-0 text-right whitespace-nowrap self-center">
          Last contact
          <br />
          {lastContactDays === undefined
            ? "—"
            : lastContactDays === null
              ? "No emails"
              : `${lastContactDays} days ago`}
        </p>
      </div>
    </div>
  );
};

const ClientDetailTabs = ({ client, googleAccessToken }: { client: Client; googleAccessToken: string | null }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Lets the onboarding guide switch tabs programmatically as it narrates each one.
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<string>).detail;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("flowtex:clients-guide-set-tab", handler);
    return () => window.removeEventListener("flowtex:clients-guide-set-tab", handler);
  }, []);
  const [emails, setEmails] = useState<Email[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes, setNotes] = useState(client.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [emailsFetched, setEmailsFetched] = useState(false);
  const [meetingsFetched, setMeetingsFetched] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [loadingEmailDetail, setLoadingEmailDetail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [insight, setInsight] = useState<string | null>(client.ai_insight || null);
  const [insightGeneratedAt, setInsightGeneratedAt] = useState<string | null>(client.ai_insight_generated_at || null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState(false);

  const generateInsight = async () => {
    setLoadingInsight(true);
    setInsightError(false);
    try {
      const response = await fetch(`/api/clients/${client.id}/insight`, { method: "POST" });
      if (!response.ok) throw Object.assign(new Error("Failed to generate insight"), { status: response.status });
      const data = await response.json();
      if (data.insight) {
        setInsight(data.insight);
        setInsightGeneratedAt(data.generated_at);
      } else {
        setInsightError(true);
      }
    } catch (err) {
      console.error("Failed to generate client insight:", err);
      setInsightError(true);
      toast.show({
        ...classifyError(err, "Insight", "generated"),
        onRetry: () => generateInsight(),
      });
    } finally {
      setLoadingInsight(false);
    }
  };

  const openEmail = async (emailId: string) => {
    setShowEmailModal(true);
    setLoadingEmailDetail(true);
    setSelectedEmail(null);
    try {
      const response = await fetch(`/api/gmail/message/${emailId}`);
      if (!response.ok) throw Object.assign(new Error("Failed to fetch email"), { status: response.status });
      const data = await response.json();
      if (data.id) {
        setSelectedEmail(data);
      }
    } catch (err) {
      console.error("Failed to fetch email detail:", err);
      setShowEmailModal(false);
      toast.show({
        ...classifyError(err, "Email", "loaded"),
        onRetry: () => openEmail(emailId),
      });
    } finally {
      setLoadingEmailDetail(false);
    }
  };

  const saveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw Object.assign(new Error("Failed to save notes"), { status: response.status });
    } catch (err) {
      console.error("Failed to save notes:", err);
      toast.show({
        ...classifyError(err, "Notes", "saved"),
        onRetry: () => saveNotes(),
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const fetchEmails = async (force = false) => {
    if (emailsFetched && !force) return;
    setLoadingEmails(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/emails`, {
        headers: googleAccessToken ? { "x-google-access-token": googleAccessToken } : {},
      });
      if (!response.ok) throw Object.assign(new Error("Failed to fetch emails"), { status: response.status });
      const data = await response.json();
      setEmails(data.emails || []);
      setEmailsFetched(true);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
      // Deliberately not marking emailsFetched here — an empty list on failure
      // used to look identical to "this client has no emails"; leaving it
      // unfetched lets the tab retry next time it's opened instead of lying.
      toast.show({
        ...classifyError(err, "Emails", "loaded"),
        onRetry: () => fetchEmails(true),
      });
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchMeetings = async (force = false) => {
    if (meetingsFetched && !force) return;
    setLoadingMeetings(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/meetings`, {
        headers: googleAccessToken ? { "x-google-access-token": googleAccessToken } : {},
      });
      if (!response.ok) throw Object.assign(new Error("Failed to fetch meetings"), { status: response.status });
      const data = await response.json();
      setMeetings(data.meetings || []);
      setMeetingsFetched(true);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      // Same reasoning as fetchEmails — don't mark as fetched on failure, so
      // the empty state isn't mistaken for "no meetings" and it retries later.
      toast.show({
        ...classifyError(err, "Meetings", "loaded"),
        onRetry: () => fetchMeetings(true),
      });
    } finally {
      setLoadingMeetings(false);
    }
  };

  // Reset per-client state and load the Overview counts as soon as a client is selected,
  // not just when the user clicks into the Emails/Meetings tabs.
  useEffect(() => {
    setActiveTab("overview");
    setEmails([]);
    setMeetings([]);
    setEmailsFetched(false);
    setMeetingsFetched(false);
    setNotes(client.notes || "");
    setInsight(client.ai_insight || null);
    setInsightGeneratedAt(client.ai_insight_generated_at || null);
    setInsightError(false);
    fetchEmails(true);
    fetchMeetings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const nextMeeting = meetings
    .filter((m) => new Date(m.start).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];

  const lastEmail = emails[0];

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "emails", label: "Emails", icon: Mail, onClick: fetchEmails },
    { id: "meetings", label: "Meetings", icon: Calendar, onClick: fetchMeetings },
    { id: "notes", label: "Notes", icon: FileText },
  ];

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Tab Navigation */}
      <div data-onboarding="clients-tabs-nav" className="flex gap-[var(--space-1)] border-b border-[var(--color-border-default)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              tab.onClick?.();
            }}
            className={`px-[var(--space-4)] py-[var(--space-2)] border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--color-text-primary)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div data-onboarding="clients-tab-overview" className="space-y-[var(--space-6)]">
          <div className="grid grid-cols-2 gap-[var(--space-4)]">
            <div
              onClick={lastEmail ? () => openEmail(lastEmail.id) : undefined}
              className={`p-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] ${lastEmail ? "cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors" : ""}`}
            >
              <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)] mb-[var(--space-1)]">Last Email</p>
              {loadingEmails ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-3/4 mb-[var(--space-1)]" />
                  <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-1/3 mt-[var(--space-1)]" />
                </div>
              ) : lastEmail ? (
                <>
                  <p className="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)] truncate">{lastEmail.subject}</p>
                  <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)] mt-[var(--space-1)]">{new Date(lastEmail.date).toLocaleDateString()}</p>
                </>
              ) : (
                <p className="text-[length:var(--text-base)] text-[var(--color-text-disabled)]">No emails yet</p>
              )}
            </div>
            <div className="p-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">
              <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)] mb-[var(--space-1)]">Next Meeting</p>
              {loadingMeetings ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-3/4 mb-[var(--space-1)]" />
                  <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-1/2 mt-[var(--space-1)]" />
                </div>
              ) : nextMeeting ? (
                <>
                  <p className="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)] truncate">{nextMeeting.title}</p>
                  <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)] mt-[var(--space-1)]">
                    {new Date(nextMeeting.start).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(nextMeeting.start).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </>
              ) : (
                <p className="text-[length:var(--text-base)] text-[var(--color-text-disabled)]">None scheduled</p>
              )}
            </div>
          </div>

          <div className="p-[var(--space-4)] rounded-[var(--radius-lg)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">
            <div className="flex items-center justify-between mb-[var(--space-2)]">
              <div className="flex items-center gap-[var(--space-2)]">
                <Sparkles size={18} className="text-[var(--color-accent)]" />
                <p className="text-[length:var(--text-base)] font-medium text-[var(--color-text-primary)]">AI Insight</p>
              </div>
              {insight && !loadingInsight && (
                <button
                  onClick={generateInsight}
                  className="flex items-center gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <RefreshCw size={13} /> Regenerate
                </button>
              )}
            </div>

            {loadingInsight ? (
              <div className="space-y-[var(--space-2)] animate-pulse">
                <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-full" />
                <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-5/6" />
                <div className="h-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-sm)] w-2/3" />
              </div>
            ) : insight ? (
              <>
                <p className="text-[length:var(--text-base)] text-[var(--color-text-secondary)] leading-relaxed">{insight}</p>
                {insightGeneratedAt && (
                  <p className="text-[length:var(--text-sm)] text-[var(--color-text-disabled)] mt-[var(--space-2)]">
                    Generated {new Date(insightGeneratedAt).toLocaleString()}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between gap-[var(--space-4)]">
                <p className="text-[length:var(--text-base)] text-[var(--color-text-muted)]">
                  Get an AI read on this client — how the relationship is going and what to do next, based on notes, emails and meetings.
                </p>
                <button
                  onClick={generateInsight}
                  className="px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--text-sm)] font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex-shrink-0"
                >
                  Generate insight
                </button>
              </div>
            )}
            {insightError && (
              <p className="text-[length:var(--text-xs)] mt-[var(--space-2)]" style={{ color: "var(--color-error)" }}>
                Could not generate the insight. Try again.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "emails" && (
        <div data-onboarding="clients-tab-emails" className="space-y-[var(--space-3)]">
          {loadingEmails ? (
            <EmailRowSkeleton />
          ) : emails.length === 0 ? (
            <div className="text-center py-[var(--space-8)]">
              <p className="text-[var(--color-text-disabled)]">No emails found for this client</p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                onClick={() => openEmail(email.id)}
                className="p-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-[length:var(--text-sm)] ${email.isUnread ? "font-bold" : ""} text-[var(--color-text-primary)]`}>
                      {email.subject}
                    </p>
                    <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)]">{email.from}</p>
                    <p className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] mt-[var(--space-1)] line-clamp-2">{email.snippet}</p>
                  </div>
                  <p className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] whitespace-nowrap ml-[var(--space-2)]">
                    {new Date(email.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showEmailModal && (
        <EmailDetailModal
          email={selectedEmail}
          isLoading={loadingEmailDetail}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {activeTab === "meetings" && (
        <div data-onboarding="clients-tab-meetings" className="space-y-[var(--space-3)]">
          {loadingMeetings ? (
            <MeetingRowSkeleton />
          ) : meetings.length === 0 ? (
            <div className="text-center py-[var(--space-8)]">
              <p className="text-[var(--color-text-disabled)]">No meetings found for this client</p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-base)]"
              >
                <p className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-primary)]">{meeting.title}</p>
                <p className="text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                  {new Date(meeting.start).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div data-onboarding="clients-tab-notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Write anything about this client — context, preferences, history..."
            className="w-full h-64 p-[var(--space-4)] bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
          />
          {isSavingNotes && <p className="text-[length:var(--text-xs)] text-[var(--color-text-disabled)] mt-[var(--space-2)]">Saving...</p>}
        </div>
      )}
    </div>
  );
};

// Client/CRM dashboard — lists clients with notes, last-contact info, and
// per-client emails/meetings pulled from connected integrations.
export default function ClientsPage() {
  const toast = useToast();
  const { googleAccessToken } = useGoogle();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "lead" | "inactive">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Lets the onboarding guide know when the "Add Client" modal opens/closes, so it can
  // get out of the way (the modal renders above the guide's dark overlay otherwise).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(showAddModal ? "flowtex:clients-guide-modal-open" : "flowtex:clients-guide-modal-close"));
  }, [showAddModal]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [clientPendingDelete, setClientPendingDelete] = useState<Client | null>(null);
  const [lastContactMap, setLastContactMap] = useState<Record<string, number | null>>({});

  useEffect(() => {
    fetchClients();
    fetchLastContact();
  }, []);

  const fetchLastContact = async () => {
    try {
      const response = await fetch("/api/clients/last-contact");
      if (!response.ok) throw Object.assign(new Error("Failed to fetch last contact"), { status: response.status });
      const data = await response.json();
      setLastContactMap(data.lastContact || {});
    } catch (err) {
      // Low-stakes background enhancement (the "last contacted Xd ago" badge) —
      // no retry button, a toast every time this fails would be more annoying
      // than useful, but the user should still know why the badges are blank.
      console.error("Failed to fetch last contact info:", err);
      toast.show(classifyError(err, "Last contact info", "loaded"));
    }
  };

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw Object.assign(new Error("Failed to fetch clients"), { status: response.status });
      const data = await response.json();
      setClients(data.clients || []);
      if (data.clients?.length > 0) {
        setSelectedClient(data.clients[0]);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      toast.show({
        ...classifyError(err, "Clients", "loaded"),
        onRetry: () => fetchClients(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (formData: any) => {
    setIsAddingClient(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        // 400/409 are the validation/duplicate checks below rejecting bad
        // input — show that exact reason instead of a generic "wasn't saved".
        if ((response.status === 400 || response.status === 409) && data.error) {
          toast.show({ title: "Couldn't add client", message: data.error, tone: "error" });
          return;
        }
        throw Object.assign(new Error("Failed to add client"), { status: response.status });
      }
      if (data.client) {
        setClients([data.client, ...clients]);
        setSelectedClient(data.client);
        setShowAddModal(false);
        window.dispatchEvent(new CustomEvent("flowtex:clients-guide-client-created"));
      }
    } catch (err) {
      console.error("Failed to add client:", err);
      toast.show({
        ...classifyError(err, "Client", "saved"),
        onRetry: () => handleAddClient(formData),
      });
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleEditClient = async (formData: any) => {
    if (!editingClient) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw Object.assign(new Error("Failed to update client"), { status: response.status });
      const data = await response.json();
      if (data.client) {
        setClients(clients.map((c) => (c.id === data.client.id ? data.client : c)));
        if (selectedClient?.id === data.client.id) {
          setSelectedClient(data.client);
        }
        setEditingClient(null);
      }
    } catch (err) {
      console.error("Failed to update client:", err);
      toast.show({
        ...classifyError(err, "Client", "updated"),
        onRetry: () => handleEditClient(formData),
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClient = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw Object.assign(new Error("Failed to delete client"), { status: res.status });
      const remaining = clients.filter((c) => c.id !== id);
      setClients(remaining);
      if (selectedClient?.id === id) {
        setSelectedClient(remaining[0] || null);
      }
      return true;
    } catch (err) {
      console.error("Failed to delete client:", err);
      toast.show({
        ...classifyError(err, "Client", "deleted"),
        onRetry: () => handleDeleteClient(id),
      });
      return false;
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg-card)] border-b border-[var(--color-border-default)]">
        <div className="px-[var(--space-8)] py-[var(--space-6)] space-y-[var(--space-4)]">
          <div className="flex items-start justify-between gap-[var(--space-8)]">
            <div>
              <h1 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-primary)]">Clients</h1>
            </div>
          </div>

          {/* Search and Filters */}
          <div data-onboarding-group="clients-list-search" className="flex items-center gap-[var(--space-3)]">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-[var(--color-text-disabled)]" size={16} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-[var(--space-8)] pr-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Panel: Client List */}
        {/* Left Panel: Client List — hidden on small screens once a client is selected. */}
        <div
          data-onboarding-group="clients-list-search"
          className={`${selectedClient ? "hidden md:block" : "block"} w-full md:w-[35%] border-r border-[var(--color-border-default)] overflow-y-auto bg-[var(--color-bg-base)]`}
        >
          <div className="p-[var(--space-4)]">
            {!isLoading && (
              <button
                data-onboarding="clients-add-button"
                onClick={() => setShowAddModal(true)}
                className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-accent)] rounded-[var(--radius-lg)] p-[var(--space-4)] transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex items-center justify-center gap-[var(--space-2)] text-[var(--color-text-primary)] cursor-pointer mb-[var(--space-2)]"
              >
                <Plus size={20} strokeWidth={2.75} />
                <span className="text-[13px] font-bold">Add Client</span>
              </button>
            )}
            {isLoading ? (
              <ClientSkeleton />
            ) : clients.length === 0 ? (
              <div className="text-center py-[var(--space-12)]">
                <Users className="w-12 h-12 text-[var(--color-text-disabled)] mx-auto mb-[var(--space-3)] opacity-50" />
                <p className="text-[var(--color-text-primary)] font-medium">No clients yet</p>
                <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)] mb-[var(--space-4)]">
                  Add your first client to start tracking relationships.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-[var(--space-4)] py-[var(--space-2)] bg-[var(--color-accent)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors inline-flex items-center gap-[var(--space-2)]"
                >
                  <Plus size={16} /> Add Client
                </button>
              </div>
            ) : (
              filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  isSelected={selectedClient?.id === client.id}
                  onClick={() => setSelectedClient(client)}
                  lastContactDays={lastContactMap[client.id]}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Client Detail */}
        {/* Right Panel: Client Detail — the only panel shown on small screens once a
            client is selected; a "Back" button there returns to the list. */}
        <div
          data-onboarding="clients-detail-panel"
          className={`${selectedClient ? "block" : "hidden md:block"} flex-1 overflow-y-auto bg-[var(--color-bg-base)]`}
        >
          {selectedClient ? (
            <div className="p-[var(--space-8)]">
              <button
                onClick={() => setSelectedClient(null)}
                className="md:hidden flex items-center gap-[var(--space-1)] text-[length:var(--text-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-[var(--space-4)]"
              >
                <ChevronLeft size={16} /> Back to clients
              </button>
              <div data-onboarding="clients-detail-header" className="flex items-start gap-[var(--space-6)] mb-[var(--space-8)] pb-[var(--space-6)] border-b border-[var(--color-border-default)]">
                <ClientAvatar client={selectedClient} size="clamp(40px, 4vw, 56px)" textSize="text-[length:var(--text-2xl)]" />

                <div className="flex-1">
                  <h2 className="text-[length:var(--text-2xl)] font-bold text-[var(--color-text-primary)]">
                    {selectedClient.name}
                    {selectedClient.company && (
                      <span className="text-[length:var(--text-2xl)] font-normal text-[var(--color-text-muted)]"> | {selectedClient.company}</span>
                    )}
                  </h2>
                  <div className="flex items-center gap-[var(--space-4)] mt-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                  </div>
                </div>

                <div className="flex gap-[var(--space-2)]">
                  <button
                    onClick={() => setEditingClient(selectedClient)}
                    className="p-[var(--space-2)] text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] rounded-[var(--radius-md)] transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setClientPendingDelete(selectedClient)}
                    className="p-[var(--space-2)] text-[var(--color-text-disabled)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-card)] rounded-[var(--radius-md)] transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <ClientDetailTabs client={selectedClient} googleAccessToken={googleAccessToken} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="w-16 h-16 text-[var(--color-text-disabled)] mb-[var(--space-4)] opacity-30" />
              <p className="text-[var(--color-text-primary)] font-medium">Select a client to see their details</p>
            </div>
          )}
        </div>
      </div>

      <ClientFormModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddClient} isSubmitting={isAddingClient} />
      <ClientFormModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSubmit={handleEditClient}
        initialData={editingClient}
        isSubmitting={isSavingEdit}
      />

      <ConfirmDeleteModal
        isOpen={!!clientPendingDelete}
        onClose={() => setClientPendingDelete(null)}
        onConfirm={() => handleDeleteClient(clientPendingDelete!.id)}
        title="Delete client?"
        description={`"${clientPendingDelete?.name ?? ""}" will be permanently deleted. This can't be undone.`}
        successMessage="Client deleted"
      />
    </div>
  );
}
