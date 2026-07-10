// Turns a raw Google/Notion API error into a short, clean sentence for the
// chat bubble — same idea as lib/error-messages.ts (classify, don't just
// stringify), but for provider errors surfaced by the chatbot's tools
// instead of network errors surfaced by the app's own fetch calls.
export type ChatErrorService = "google" | "notion";

function getStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const e = error as Record<string, unknown>;
  const candidates = [
    e.status,
    e.code,
    (e.response as Record<string, unknown> | undefined)?.status,
  ];
  for (const c of candidates) {
    const n = typeof c === "string" ? parseInt(c, 10) : c;
    if (typeof n === "number" && !Number.isNaN(n)) return n;
  }
  return undefined;
}

function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function describeProviderError(error: unknown, service: ChatErrorService): string {
  const status = getStatus(error);
  // Notion attaches a machine-readable `code` (e.g. "object_not_found") on top
  // of its message — fold it in so the substring checks below catch it too.
  const code = error && typeof error === "object" ? (error as Record<string, unknown>).code : undefined;
  const message = `${getMessage(error)} ${typeof code === "string" ? code : ""}`.toLowerCase();
  const provider = service === "google" ? "Google" : "Notion";

  const isAuthError =
    status === 401 ||
    message.includes("invalid_grant") ||
    message.includes("invalid_token") ||
    message.includes("unauthorized") ||
    message.includes("invalid credentials");

  if (isAuthError) {
    return `Your ${provider} connection seems to have expired. Try reconnecting it in Settings → Integrations.`;
  }

  const isNotFound =
    status === 404 ||
    message.includes("not found") ||
    message.includes("object_not_found");

  if (isNotFound) {
    return "That no longer exists — it may have already been deleted elsewhere.";
  }

  const isPermissionError =
    status === 403 ||
    message.includes("insufficient") ||
    message.includes("permission") ||
    message.includes("restricted_resource");

  if (isPermissionError) {
    return `I don't have permission to do that in ${provider} — check the access this integration has.`;
  }

  const isRateLimited =
    status === 429 ||
    message.includes("rate_limited") ||
    message.includes("rate limit") ||
    message.includes("too many requests");

  if (isRateLimited) {
    return "Too many requests right now — try again in a moment.";
  }

  return `Something went wrong on ${provider}'s side. Try again.`;
}
