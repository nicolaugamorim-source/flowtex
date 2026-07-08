"use client";

import { GoogleAuthButton } from "./google-auth-button";

// Sign-in is Google-only — required anyway for the Gmail/Calendar/Notion
// integrations the product is built around, so a separate email/password
// path would just be a second account system to maintain for no benefit.
export function LoginForm() {
  return (
    <div className="flex items-center justify-center min-h-screen w-screen relative" style={{ backgroundColor: "var(--color-bg)" }}>
      <a
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: "var(--color-text-muted)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text-primary)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-muted)")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Back
      </a>
      <div className="mx-auto w-full space-y-2 text-center flex flex-col items-center">
        <div className="space-y-2 mb-10 text-center">
          <img src="/logo.svg" alt="Flowtex" width={128} height={128} className="mx-auto mb-2" />
          <h1 className="text-6xl font-semibold whitespace-nowrap" style={{ color: "var(--color-text-primary)" }}>Welcome!</h1>
          <p className="text-base max-w-sm mx-auto pt-3" style={{ color: "var(--color-text-muted)" }}>
            Sign in with Google so Flowtex can connect to Gmail, Calendar, and your other integrations.
          </p>
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <GoogleAuthButton />
        </div>
      </div>
    </div>
  );
}
