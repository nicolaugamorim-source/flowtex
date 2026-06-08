import HeroFlowtex from "@/components/landing/hero-flowtex";
import { FeaturesCards } from "@/components/landing/features-cards";
import IntegrationHero from "@/components/landing/integration-hero";
import { Features } from "@/components/landing/features-2";
import { Pricing } from "@/components/landing/pricing";
import { CTASection } from "@/components/landing/cta-with-rectangle";
import { Footer } from "@/components/ui/footer";
import { Code, Share2, Link } from "lucide-react";

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
    href: "/sign-up",
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
    buttonText: "Get your team in sync",
    href: "/sign-up",
    isPopular: true,
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
    buttonText: "Talk to us",
    href: "/contact",
    isPopular: false,
  },
];

export default function Home() {
  return (
    <>
      <main className="w-full overflow-x-hidden bg-[#F8FAFC]">
        <HeroFlowtex />
        <IntegrationHero />
        <FeaturesCards />
        <Features />
        <Pricing
          plans={pricingPlans}
          title="Pricing plans for every stage"
          description="Choose the plan that fits your needs.\nAll plans include everything you need to get started with Flowtex."
        />
        <CTASection
          title="Where work flows.<br />Your team starts here."
          description="Join teams that are already saving 6+ hours per week with Flowtex."
          action={{
            text: "Start building now",
            href: "/sign-up",
            variant: "default"
          }}
        />
      </main>
      <Footer
        logo={<img src="/logo.svg" alt="Flowtex" width={32} height={32} />}
        brandName="Flowtex"
        socialLinks={[
          {
            icon: <Share2 className="h-5 w-5" />,
            href: "https://twitter.com",
            label: "Twitter",
          },
          {
            icon: <Code className="h-5 w-5" />,
            href: "https://github.com",
            label: "GitHub",
          },
          {
            icon: <Link className="h-5 w-5" />,
            href: "https://linkedin.com",
            label: "LinkedIn",
          },
        ]}
        mainLinks={[
          { href: "/pricing", label: "Pricing" },
          { href: "/about", label: "About" },
          { href: "/blog", label: "Blog" },
          { href: "/contact", label: "Contact" },
        ]}
        legalLinks={[
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ]}
        copyright={{
          text: "© 2024 Flowtex",
          license: "All rights reserved",
        }}
      />
    </>
  )
}
