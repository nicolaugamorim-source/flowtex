import { emailLayout, emailButton, BRAND_COLORS } from "./layout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface EmailTemplate {
  subject: string;
  html: string;
}

export function welcomeEmail(name: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Welcome to Flowtex",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Welcome, ${firstName}</h1>
      <p style="margin:0 0 16px;">Flowtex connects your Gmail, Calendar, and Notion, and learns your business context so it can act on it — no re-explaining, no switching apps.</p>
      <p style="margin:0 0 16px;">A good first step: connect an integration and try asking the assistant to do something real, like checking today's schedule or drafting a reply.</p>
      ${emailButton("Open Flowtex", `${APP_URL}/app`)}
    `),
  };
}

export function trialEndingEmail(name: string, daysLeft: number): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: `Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — just a heads up before your Flowtex trial wraps up. Add a payment method to keep your integrations, kanban board, and chat history without interruption.</p>
      ${emailButton("Manage billing", `${APP_URL}/settings`)}
    `),
  };
}

export function paymentFailedEmail(name: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "We couldn't process your payment",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;color:#C0392B;">Payment failed</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — we tried to charge your card for Flowtex and it didn't go through. Update your payment method to avoid losing access.</p>
      ${emailButton("Update payment method", `${APP_URL}/settings`)}
    `),
  };
}

export function paymentSucceededEmail(name: string, amount: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Payment received — thank you",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Payment received</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — thanks for your payment of <strong>${amount}</strong>. Your Flowtex subscription is active.</p>
      ${emailButton("Open Flowtex", `${APP_URL}/app`)}
    `),
  };
}

// Time-based, not event-based: sent by a daily cron (app/api/cron/activation-nudge)
// to accounts that logged in but never started a trial or subscribed.
export function activationNudgeEmail(name: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Still there? Here's what Flowtex can do for you",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Pick up where you left off</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — you signed up for Flowtex a couple of days ago but haven't started a trial yet. Connect Gmail or Calendar and ask the assistant to handle something real — it only takes a minute to see it work.</p>
      ${emailButton("Start your trial", `${APP_URL}/pricing`)}
    `),
  };
}

// Distinct from welcomeEmail (fires on Google signup, before any payment) —
// this is the moment access actually becomes real: checkout completed
// straight to a paid, non-trialing subscription, so /app is usable for the
// first time because of an actual charge, not just an account existing.
export function accountActivatedEmail(name: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "You're in — Flowtex is ready",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">You're all set, ${firstName}</h1>
      <p style="margin:0 0 16px;">Your payment went through and Flowtex is fully unlocked. Connect Gmail, Calendar, or Notion and ask the assistant to handle something real — that's the fastest way to see what it can do.</p>
      ${emailButton("Open Flowtex", `${APP_URL}/app`)}
    `),
  };
}

export function trialStartedEmail(name: string, trialEndDate: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Your Flowtex trial has started",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Your trial is live</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — your Flowtex trial is active until <strong>${trialEndDate}</strong>. Connect Gmail, Calendar, or Notion now so the assistant has something to work with from day one.</p>
      ${emailButton("Open Flowtex", `${APP_URL}/app`)}
    `),
  };
}

// Sent the moment `cancel_at_period_end` flips true — the app never surfaced
// this before, so a cancellation looked identical to "nothing happened" until
// access was cut at the very end of the period.
export function cancellationScheduledEmail(name: string, accessUntilDate: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Your subscription is set to cancel",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Cancellation confirmed</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — your Flowtex subscription won't renew. You'll keep full access until <strong>${accessUntilDate}</strong>, then it'll end automatically. No further charge will happen.</p>
      <p style="margin:0 0 16px;">Changed your mind? You can resume anytime before that date.</p>
      ${emailButton("Manage subscription", `${APP_URL}/settings`)}
    `),
  };
}

// Sent when access actually ends — either the scheduled cancellation above
// reached its date, or the subscription was terminated some other way
// (e.g. cancelled directly in Stripe).
export function subscriptionEndedEmail(name: string): EmailTemplate {
  const firstName = name?.split(" ")[0] || "there";
  return {
    subject: "Your Flowtex subscription has ended",
    html: emailLayout(`
      <h1 style="font-size:20px;margin:0 0 12px;">Your subscription has ended</h1>
      <p style="margin:0 0 16px;">Hi ${firstName} — your Flowtex access has ended. Your data (clients, tasks, chat history) is kept safe and picks up right where you left off if you resubscribe.</p>
      ${emailButton("Resubscribe", `${APP_URL}/pricing`)}
    `),
  };
}

export { BRAND_COLORS };
