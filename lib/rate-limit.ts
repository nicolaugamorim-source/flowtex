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
