// Turns a raw fetch/Supabase error into a short, honest, user-facing message.
// The browser can't tell us *why* the network is down, but it does distinguish
// "no connection at all" from "the server responded with a failure" from
// "your session no longer authorizes this" — that's the split worth surfacing.
export interface ClassifiedError {
  title: string;
  message: string;
}

export type ErrorCategory = "offline" | "connection-lost" | "server" | "auth" | "timeout" | "generic";

// The verb matters: a failed delete isn't "wasn't saved", it's "wasn't deleted".
// Callers pass whichever action they were actually attempting.
export type ErrorAction = "saved" | "deleted" | "updated" | "moved" | "sent" | "loaded" | "generated";

const REASONS: Record<ErrorCategory, { title: string; reason: string }> = {
  offline: { title: "You're offline", reason: "check your connection and try again." },
  "connection-lost": { title: "Connection lost", reason: "the request never reached the server." },
  auth: { title: "Session expired", reason: "please sign in again." },
  server: { title: "Server error", reason: "our server had a problem. Try again shortly." },
  timeout: { title: "Request timed out", reason: "the server took too long to respond." },
  generic: { title: "Something went wrong", reason: "please try again." },
};

function buildMessage(category: ErrorCategory, subject: string, action: ErrorAction): ClassifiedError {
  const { title, reason } = REASONS[category];
  return { title, message: `${subject} wasn't ${action} — ${reason}` };
}

// Exposed so the Settings preview button can render one of each without
// needing to fabricate a matching error object per category.
export function errorMessageFor(category: ErrorCategory, subject: string, action: ErrorAction = "saved"): ClassifiedError {
  return buildMessage(category, subject, action);
}

export function classifyError(error: unknown, subject: string, action: ErrorAction = "saved"): ClassifiedError {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return buildMessage("offline", subject, action);
  }

  // A fetch() that never reached the server (DNS failure, connection refused,
  // CORS, or the network dropped mid-request) surfaces as a generic TypeError
  // with this exact message in Chrome/Firefox/Safari.
  if (error instanceof TypeError && /failed to fetch|networkerror/i.test(error.message)) {
    return buildMessage("connection-lost", subject, action);
  }

  const status = extractStatus(error);

  if (status === 401 || status === 403) {
    return buildMessage("auth", subject, action);
  }

  if (status && status >= 500) {
    return buildMessage("server", subject, action);
  }

  if (status === 408 || (error instanceof DOMException && error.name === "AbortError")) {
    return buildMessage("timeout", subject, action);
  }

  return buildMessage("generic", subject, action);
}

function extractStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const withStatus = error as { status?: unknown; statusCode?: unknown };
    const status = withStatus.status ?? withStatus.statusCode;
    if (typeof status === "number") return status;
  }
  return undefined;
}
