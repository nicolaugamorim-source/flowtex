// Simple in-memory sliding-window rate limiter. This is not shared across
// serverless instances, so it isn't a hard security boundary — it exists to
// catch a runaway retry loop or script hammering the chat endpoint, not to
// withstand a distributed attack. Good enough given the actual risk (Anthropic
// cost on Haiku is small; the bigger risk is tripping Gmail/Calendar/Notion's
// own per-user rate limits or degrading the app for other users).
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest request in the window falls out of it. */
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    buckets.set(key, timestamps);
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - timestamps[0])) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { allowed: true, retryAfterSeconds: 0 };
}

// 20/min is well above what a person typing, sending, waiting for a reply,
// and reading it could hit — it only catches loops/scripts, never real usage.
export function checkChatRateLimit(key: string): RateLimitResult {
  return checkRateLimit(`chat:${key}`, 20, 60_000);
}

// The public contact form has no auth to key off, so this is the one thing
// standing between it and being hammered for spam/abuse — 5 per 10 minutes
// per IP is well above a real visitor's usage, low enough to blunt a bot.
export function checkContactRateLimit(key: string): RateLimitResult {
  return checkRateLimit(`contact:${key}`, 5, 10 * 60_000);
}

// Token-refresh endpoints hit Google's OAuth token endpoint on every call —
// 20/min per user is well above legitimate refresh frequency and guards
// against a runaway retry loop hammering Google's rate limits.
export function checkTokenRefreshRateLimit(key: string): RateLimitResult {
  return checkRateLimit(`token-refresh:${key}`, 20, 60_000);
}

// Sending email via Gmail on the user's behalf — 20/min per user is well
// above what a person composing/sending emails could hit, and guards against
// a runaway retry loop or compromised session spamming through the user's
// mailbox.
export function checkEmailSendRateLimit(key: string): RateLimitResult {
  return checkRateLimit(`email-send:${key}`, 20, 60_000);
}
