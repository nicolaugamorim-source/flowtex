import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flowtex - Your AI Second Brain for Founders",
  description: "Connect all your tools and give your AI the full context of your business. Flowtex is your AI second brain.",
  openGraph: {
    title: "Flowtex - Your AI Second Brain for Founders",
    description: "Connect all your tools and give your AI the full context of your business. Flowtex is your AI second brain.",
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}>
      <body className="min-h-full flex flex-col bg-[#080810] overflow-x-hidden">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
