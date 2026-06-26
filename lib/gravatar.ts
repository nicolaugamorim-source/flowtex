import crypto from "crypto";

// Returns a Gravatar URL that 404s when the email has no profile picture set
// (d=404), so the frontend can fall back to the initials avatar on load error.
export function getGravatarUrl(email?: string | null, size = 80): string | null {
  if (!email) return null;
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=${size}`;
}
