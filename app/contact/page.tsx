import { Footer } from "@/components/ui/footer";

export default function ContactPage() {

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
              <h1 className="text-4xl md:text-5xl font-bold text-[#0D1F2D] mb-2">Contact</h1>
              <p className="text-[#4A6880] mb-8">Have questions? Get in touch with us.</p>

              <div className="space-y-3 text-[#2E4A62]">
                <p className="text-lg">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:support@flowtex.xyz" className="text-[#00D4A4] hover:underline font-semibold">
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
