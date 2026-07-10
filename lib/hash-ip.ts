import { createHash } from "crypto";
import { NextRequest } from "next/server";

export function getRequestIp(request: NextRequest): string | null {
  // x-real-ip is set by Vercel's edge and isn't client-controllable, so it's
  // trusted first. x-forwarded-for, on the other hand, is a client-supplied
  // header that Vercel appends the real client IP to as the rightmost hop —
  // the leftmost entry is attacker-controlled and must not be trusted.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return null;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${process.env.IP_HASH_SALT}`).digest("hex");
}
