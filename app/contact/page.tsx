"use client"

import { useState, FormEvent } from "react";
import { Footer } from "@/components/ui/footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aqui podes integrar com SendGrid, Resend, ou outro serviço de email
      // Por enquanto, apenas mostra mensagem de sucesso
      console.log("Form data:", formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-[#C8D8E6] sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Flowtex" width={32} height={32} />
            <span className="font-bold text-xl text-[#0D1F2D]">Flowtex</span>
          </a>
          <a href="/" className="text-[#4A6880] hover:text-[#0D1F2D] transition-colors">← Back</a>
        </nav>
      </header>

      <main className="min-h-screen bg-[#F8FAFC]">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-[#C8D8E6] p-8 md:p-12">
              <h1 className="text-4xl md:text-5xl font-bold text-[#0D1F2D] mb-2">Get in Touch</h1>
              <p className="text-[#4A6880] mb-8">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>

              {submitted && (
                <div className="mb-8 p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-green-800 font-semibold">✓ Message sent successfully!</p>
                  <p className="text-green-700 text-sm mt-1">We'll get back to you at {formData.email}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#0D1F2D] mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#C8D8E6] bg-white text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:ring-2 focus:ring-[#00D4A4] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0D1F2D] mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#C8D8E6] bg-white text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:ring-2 focus:ring-[#00D4A4] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0D1F2D] mb-2">Subject</label>
                  <input
                    type="text"
                    placeholder="What is this about?"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#C8D8E6] bg-white text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:ring-2 focus:ring-[#00D4A4] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#0D1F2D] mb-2">Message</label>
                  <textarea
                    placeholder="Tell us more..."
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#C8D8E6] bg-white text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:ring-2 focus:ring-[#00D4A4] focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00D4A4] text-[#0D1F2D] px-6 py-3 rounded-lg font-semibold hover:bg-[#00A882] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>

              <div className="mt-12 pt-8 border-t border-[#C8D8E6]">
                <h3 className="text-lg font-semibold text-[#0D1F2D] mb-4">Contact Info</h3>
                <div className="space-y-3 text-[#2E4A62]">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:support@flowtex.xyz" className="text-[#00D4A4] hover:underline">
                      support@flowtex.xyz
                    </a>
                  </p>
                  <p>
                    <strong>Response time:</strong> We typically respond within 24 hours
                  </p>
                </div>
              </div>
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
