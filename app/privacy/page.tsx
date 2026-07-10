import { Footer } from "@/components/ui/footer";

// Public privacy policy page.
export default function PrivacyPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2">Privacy Policy</h1>
          <p className="text-[var(--color-text-muted)] mb-8">Last updated: June 2026</p>

          <div className="space-y-8 text-[var(--color-text-secondary)]">
            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">1. Introduction</h2>
              <p>
                Flowtex ("we", "our", or "us") operates the website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">2. Information Collection and Use</h2>
              <p className="mb-3">We collect several different types of information for various purposes to provide and improve our service to you.</p>

              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mt-4 mb-2">Types of Data Collected:</h3>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Personal Data:</strong> Email address, name, phone number, address, cookies and usage data</li>
                <li><strong>Usage Data:</strong> Browser type and version, IP address, pages visited, time and date of visit, time spent on pages</li>
                <li><strong>Connected Accounts Data:</strong> Information from your connected third-party services (Gmail, Google Calendar, Notion, Google Drive)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">3. Use of Data</h2>
              <p>Flowtex uses the collected data for various purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li>To provide and maintain our service</li>
                <li>To notify you about changes to our service</li>
                <li>To allow you to participate in interactive features of our service</li>
                <li>To provide customer support and respond to your requests</li>
                <li>To gather analysis or valuable information so that we can improve our service</li>
                <li>To monitor the usage of our service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">4. Security of Data</h2>
              <p>
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">5. Third-Party Services</h2>
              <p className="mb-3">
                We use third-party services to facilitate our service, provide the service on our behalf, perform service-related services, or assist us in analyzing how our service is used. These third parties have access to your personal data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Third parties: Google (Gmail, Google Calendar, Google Drive), Notion, Analytics providers, Payment processors
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">6. Links to Other Sites</h2>
              <p>
                Our service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">7. Children's Privacy</h2>
              <p>
                Our service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If we become aware that we have collected personal data from a child without verification of parental consent, we take steps to remove such data and terminate the child's account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">8. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">9. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">10. Contact Us</h2>
              <p className="mb-2">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> privacy@flowtex.xyz<br/>
                <strong>Address:</strong> Flowtex, Portugal
              </p>
            </section>

            <section className="bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg p-4 mt-8">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">GDPR Compliance</h3>
              <p className="text-sm">
                Flowtex is committed to complying with the General Data Protection Regulation (GDPR) and other applicable data protection laws. We have implemented appropriate technical and organizational measures to ensure a level of security appropriate to the risk.
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
