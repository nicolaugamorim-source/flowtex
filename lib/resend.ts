import { Resend } from "resend";

// Reused across requests instead of constructing a new client per email.
let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

// Send-only address — no inbox exists for it, and it shouldn't (all
// automated product email comes from here). Real support replies go to
// support@flowtex.xyz instead (see app/api/contact/route.ts's SUPPORT_INBOX
// and app/contact/page.tsx), which is the only address that actually
// receives mail.
export const EMAIL_FROM = process.env.EMAIL_FROM || "Flowtex <noreply@flowtex.xyz>";
