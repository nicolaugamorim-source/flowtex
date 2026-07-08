import { PostHog } from "posthog-node";

// Reused across requests instead of spinning up a new client per event —
// serverless platforms reuse the process between invocations, so this amortizes fine.
let client: PostHog | null = null;

function getClient(): PostHog {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 5,
      flushInterval: 2000,
    });
  }
  return client;
}

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  try {
    const posthog = getClient();
    posthog.capture({ distinctId, event, properties });
    // Serverless functions can freeze right after the response is sent, before
    // flushInterval elapses — flush explicitly so the event isn't lost, without
    // disposing the client (shutdown() would prevent reuse on the next warm invocation).
    await posthog.flush();
  } catch (error) {
    console.error("PostHog capture error:", error);
  }
}

// Attaches/updates person properties server-side (e.g. plan, business_type) so
// server-only events aren't attributed to a person with stale or missing traits.
export async function identifyServerUser(
  distinctId: string,
  properties: Record<string, unknown>
) {
  try {
    const posthog = getClient();
    posthog.identify({ distinctId, properties });
    await posthog.flush();
  } catch (error) {
    console.error("PostHog identify error:", error);
  }
}
