"use client";

import { useState } from "react";
import { MessageSquare, Bug, Lightbulb, Star, Send, CheckCircle2 } from "lucide-react";

const TYPES = [
  { value: "general", label: "General", icon: MessageSquare },
  { value: "bug", label: "Bug report", icon: Bug },
  { value: "feature", label: "Feature request", icon: Lightbulb },
  { value: "rating", label: "Rating", icon: Star },
];

export default function FeedbackPage() {
  const [type, setType] = useState("general");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && type !== "rating") return;
    if (type === "rating" && !rating) return;

    setLoading(true);
    setError(null);

    const feedbackText = type === "rating"
      ? `Rating: ${rating}/5${content.trim() ? ` — ${content.trim()}` : ""}`
      : content.trim();

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedbackText, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="text-center" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: "var(--color-success)" }} />
          <h2 style={{ color: "var(--color-text-primary)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-semibold)" }}>Thank you!</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)", fontWeight: "var(--font-normal)" }}>Your feedback helps us improve Flowtex.</p>
          <button
            onClick={() => { setSubmitted(false); setContent(""); setRating(null); setType("general"); }}
            className="underline underline-offset-4 transition-colors"
            style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: "var(--color-bg)", padding: "var(--space-6)" }}>
      <div className="w-full max-w-xl">
        <div style={{ marginBottom: "var(--space-8)" }}>
          <h1 style={{ color: "var(--color-text-primary)", fontSize: "var(--text-2xl)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-1)" }}>Feedback</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)", fontWeight: "var(--font-normal)" }}>Tell us what's working, what's broken, or what you'd love to see.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Type selector */}
          <div className="grid grid-cols-4" style={{ gap: "var(--space-2)" }}>
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className="flex flex-col items-center border transition-all"
                style={{
                  backgroundColor: type === value ? "var(--color-accent-bg)" : "var(--color-surface)",
                  borderColor: type === value ? "var(--color-accent)" : "var(--color-border)",
                  color: type === value ? "var(--color-accent)" : "var(--color-text-muted)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-medium)",
                  borderRadius: "var(--radius-lg)",
                  gap: "var(--space-2)",
                  paddingTop: "var(--space-3)",
                  paddingBottom: "var(--space-3)",
                  paddingLeft: "var(--space-2)",
                  paddingRight: "var(--space-2)",
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Star rating (only for "rating" type) */}
          {type === "rating" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>How would you rate Flowtex?</p>
              <div className="flex" style={{ gap: "var(--space-2)" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className="h-8 w-8"
                      style={{
                        color: rating && star <= rating ? "var(--color-accent)" : "var(--color-border)",
                        fill: rating && star <= rating ? "var(--color-accent)" : "transparent",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <label style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
              {type === "rating" ? "Anything else you'd like to add? (optional)" : "Your feedback"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === "bug" ? "Describe what happened and how to reproduce it..."
                : type === "feature" ? "What would you like to see in Flowtex?"
                : type === "rating" ? "Share more details..."
                : "What's on your mind?"
              }
              rows={6}
              required={type !== "rating"}
              className="w-full border resize-none outline-none transition-colors"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
                fontSize: "var(--text-sm)",
                borderRadius: "var(--radius-md)",
                paddingLeft: "var(--space-4)",
                paddingRight: "var(--space-4)",
                paddingTop: "var(--space-3)",
                paddingBottom: "var(--space-3)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--color-accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--color-border)")}
            />
          </div>

          {error && (
            <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (!content.trim() && type !== "rating") || (type === "rating" && !rating)}
            className="flex items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-bg)", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", borderRadius: "var(--radius-md)", gap: "var(--space-2)", paddingLeft: "var(--space-6)", paddingRight: "var(--space-6)", paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "var(--color-accent-dark)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--color-accent)"; }}
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
