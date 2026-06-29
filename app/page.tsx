import HeroFlowtex from "@/components/landing/hero-flowtex";
import { FeaturesCards } from "@/components/landing/features-cards";
import { Features } from "@/components/landing/features-2";
import { Pricing } from "@/components/landing/pricing";
import { CTASection } from "@/components/landing/cta-with-rectangle";
import { Footer } from "@/components/ui/footer";

const pricingPlans = [
  {
    name: "Solo",
    price: "29.99",
    yearlyPrice: "29.99",
    period: "/month",
    features: [
      "1 user",
      "Up to 10 integrations",
      "Shared AI context",
      "One chat to manage projects, clients, and meetings",
      "Project & client dashboard",
    ],
    description: "",
    buttonText: "Get early access",
    href: "/login",
    isPopular: false,
  },
  {
    name: "Team",
    price: "49.99",
    yearlyPrice: "49.99",
    period: "/month",
    features: [
      "Everything in Solo",
      "Up to 5 users",
      "Shared context across all team members",
      "Per-member permissions & roles",
      "10+ integrations",
      "Real-time project visibility for the whole team",
    ],
    description: "",
    buttonText: "In development",
    href: "/login",
    isPopular: true,
    disabled: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    yearlyPrice: "Contact us",
    period: "",
    features: [
      "Everything in Team",
      "Scales beyond 5 people",
      "Custom integrations on request",
      "Dedicated support",
      "Custom onboarding",
    ],
    description: "",
    buttonText: "In development",
    href: "/contact",
    isPopular: false,
    disabled: true,
  },
];

export default function Home() {
  return (
    <>
      <main className="w-full overflow-x-hidden bg-[var(--color-bg-base)]">
        <HeroFlowtex />
        <FeaturesCards />
        <div id="how-it-works">
          <Features />
        </div>
        <div id="pricing">
          <Pricing
            plans={pricingPlans.filter((plan) => plan.name === "Solo" || plan.name === "Team")}
            title="Pricing plans for every stage"
            description="Choose the plan that fits your needs.\nAll plans include everything you need to get started with Flowtex."
          />
        </div>
        <CTASection
          title="Where work flows.<br />"
          description="Stop losing context. Start building<br />with a workspace that already knows your project."
          action={{
            text: "Get Early Access",
            href: "/login",
            variant: "default"
          }}
        />
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
  )
}
