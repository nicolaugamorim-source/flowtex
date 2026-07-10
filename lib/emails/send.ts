import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import type { EmailTemplate } from "./templates";

// Sending a product email is never allowed to break the flow that triggered
// it (signup, a Stripe webhook) — log and swallow instead of throwing.
export async function sendProductEmail(
  to: string,
  template: EmailTemplate,
  options?: { replyTo?: string }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send:", template.subject);
    return;
  }

  try {
    await getResendClient().emails.send({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
    });
  } catch (error) {
    console.error("[email] Failed to send:", template.subject, error);
  }
}
