import { Footer } from "@/components/ui/footer";

// Public marketing page with contact details/form for prospects to reach the team.
export default function ContactPage() {

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
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">Contact</h1>
              <p className="text-[var(--color-text-muted)] mb-8">Have questions? Get in touch with us.</p>

              <div className="space-y-3 text-[var(--color-text-secondary)]">
                <p className="text-lg">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:support@flowtex.xyz" className="text-[var(--color-accent)] hover:underline font-semibold">
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
