import type { NextConfig } from "next";

// Every external host the app actually loads client-side — kept as an
// allowlist instead of wildcards so this stays meaningful. Update it if a
// new integration/analytics/avatar source is added, or its requests will be
// silently blocked by the browser instead of erroring loudly in dev.
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  // Next.js ships its own bootstrap/hydration scripts inline; without a
  // nonce-based setup (a bigger change touching middleware) 'unsafe-inline'
  // is required here or the app itself fails to hydrate. 'unsafe-eval' is
  // only added in dev because Turbopack/React use eval() for debugging
  // (callstack reconstruction); production never needs or gets it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://www.gravatar.com https://*.googleusercontent.com https://www.google.com https://cdn.worldvectorlogo.com https://img.icons8.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.posthog.com https://www.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          // Belt-and-braces alongside frame-ancestors above — older browsers
          // that don't understand CSP frame-ancestors still respect this.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
