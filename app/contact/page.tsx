"use client";

import { useState } from "react";
import { Send, CheckCircle2, Mail } from "lucide-react";
import { Footer } from "@/components/ui/footer";

// Public marketing page with a real contact form for prospects to reach the team.
export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border-default)] sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Flowtex" width={32} height={32} />
            <span className="font-bold text-xl text-[var(--color-text-primary)]">Flowtex</span>
          </a>
          <a href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">← Back</a>
        </nav>
      </header>

      <main className="min-h-screen bg-[var(--color-bg-base)]">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-default)] p-8 md:p-12">
              {submitted ? (
                <div className="flex flex-col items-center text-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-[var(--color-success)]" />
                  <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Message sent</h1>
                  <p className="text-[var(--color-text-muted)] max-w-md">
                    Thanks for reaching out — we typically reply within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); }}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline underline-offset-4 text-sm transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">Contact</h1>
                  <p className="text-[var(--color-text-muted)] mb-8">Have questions? Send us a message and we'll get back to you.</p>

                  <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        maxLength={200}
                        required
                        className="w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg-base)] border-[var(--color-border-default)] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className="w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg-base)] border-[var(--color-border-default)] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Message
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What's on your mind?"
                        rows={6}
                        maxLength={5000}
                        required
                        className="w-full px-4 py-2.5 rounded-lg border bg-[var(--color-bg-base)] border-[var(--color-border-default)] text-[var(--color-text-primary)] outline-none resize-none transition-colors focus:border-[var(--color-accent)]"
                      />
                    </div>

                    {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      {loading ? "Sending..." : "Send message"}
                    </button>
                  </form>

                  <div className="mt-10 pt-6 border-t border-[var(--color-border-default)] flex items-center gap-2 text-[var(--color-text-muted)] text-sm">
                    <Mail className="h-4 w-4" />
                    Prefer email? Reach us directly at{" "}
                    <a href="mailto:support@flowtex.xyz" className="text-[var(--color-accent)] hover:underline font-medium">
                      support@flowtex.xyz
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer
        logo={<img src="/logo.svg" alt="Flowtex" width={32} height={32} />}
        brandName="Flowtex"
        socialLinks={[]}
        mainLinks={[
          { href: "/contact", label: "Contact" },
        ]}
        legalLinks={[
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ]}
        copyright={{
          text: "© 2026 Flowtex",
          license: "All rights reserved",
        }}
      />
    </>
  );
}
