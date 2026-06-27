import { createHash } from "crypto";
import { NextRequest } from "next/server";

export function getRequestIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${ip}:${process.env.IP_HASH_SALT}`).digest("hex");
}
