import { Resend } from "resend";

// Reused across requests instead of constructing a new client per email.
let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

// Resend's shared onboarding@resend.dev domain only delivers to the email
// address the Resend account itself is registered with — fine for now, but
// verify flowtex.xyz in the Resend dashboard and update EMAIL_FROM before
// this needs to reach real customers.
export const EMAIL_FROM = process.env.EMAIL_FROM || "Flowtex <onboarding@resend.dev>";
