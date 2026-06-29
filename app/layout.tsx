import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthHandler } from "./auth-handler";
import { CookieProvider } from "@/lib/cookie-context";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { AICommandProvider } from "@/lib/ai-command-context";
import { AICommandModal } from "@/components/ui/ai-command-modal";
import { GoogleProvider } from "@/lib/google-context";
import { PostHogProvider } from "./providers/posthog-provider";
import "@/lib/cookie-reset";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadataBase = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL('http://localhost:3000');

export const metadata: Metadata = {
  metadataBase,
  title: "Flowtex — The AI that runs your business while you build it.",
  description: "Flowtex connects your tools, learns your business context, and acts on it. No re-explaining. No switching apps. Just results.",
  openGraph: {
    title: "Flowtex — The AI that runs your business while you build it.",
    description: "Flowtex connects your tools, learns your business context, and acts on it. No re-explaining. No switching apps. Just results.",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Flowtex Logo",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${geist.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full flex flex-col overflow-x-hidden" style={{ backgroundColor: 'var(--color-bg-base)' }}>
        <PostHogProvider>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
          storageKey="flowtex-theme"
        >
          <GoogleProvider>
            <AICommandProvider>
              <CookieProvider>
                <AuthHandler />
                {children}
                <CookieConsent />
                <AICommandModal />
                <Analytics />
                <SpeedInsights />
              </CookieProvider>
            </AICommandProvider>
          </GoogleProvider>
        </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
