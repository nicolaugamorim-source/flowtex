import { Footer } from "@/components/ui/footer";
import { Share2, Code, Link } from "lucide-react";

// Public terms of service page.
export default function TermsPage() {
  return (
    <>
      <header className="bg-white border-b border-[var(--color-border-default)] sticky top-0 z-50">
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
        <div className="bg-white rounded-2xl border border-[var(--color-border-default)] p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">Terms of Service</h1>
          <p className="text-[var(--color-text-muted)] mb-8">Last updated: June 2026</p>

          <div className="space-y-8 text-[var(--color-text-secondary)]">
            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing and using Flowtex ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. Flowtex reserves the right to make changes to these Terms of Service at any time and without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">2. Use License</h2>
              <p className="mb-3">
                Permission is granted to temporarily download one copy of the materials (information or software) on Flowtex for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on Flowtex</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">3. Disclaimer</h2>
              <p>
                The materials on Flowtex are provided on an 'as is' basis. Flowtex makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">4. Limitations</h2>
              <p>
                In no event shall Flowtex or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Flowtex, even if Flowtex or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on Flowtex could include technical, typographical, or photographic errors. Flowtex does not warrant that any of the materials on its website are accurate, complete, or current. Flowtex may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">6. Links</h2>
              <p>
                Flowtex has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Flowtex of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">7. Modifications</h2>
              <p>
                Flowtex may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">8. User Content</h2>
              <p className="mb-3">
                You retain all rights to any content you submit, post or display on or through the Service. By submitting, posting or displaying content on or through the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content in any media or medium and for any purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">9. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of Portugal, and you irrevocably submit to the exclusive jurisdiction of the courts located in Portugal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">10. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at legal@flowtex.io
              </p>
            </section>
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
          { href: "/pricing", label: "Pricing" },
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
  )
}
