import { PostHog } from "posthog-node";

export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  try {
    const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
    posthog.capture({ distinctId, event, properties });
    await posthog.shutdown();
  } catch (error) {
    console.error("PostHog capture error:", error);
  }
}
