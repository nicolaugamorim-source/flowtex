import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendProductEmail } from "@/lib/emails/send";
import { contactMessageEmail } from "@/lib/emails/templates";
import { checkContactRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/hash-ip";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPPORT_INBOX = "support@flowtex.xyz";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Public, unauthenticated form (a prospect, not a logged-in user) — stores
// the message and notifies support, instead of the old mailto: link that
// gave the sender no confirmation and us no record it ever arrived.
export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRequestIp(request) || "anonymous";
    const rateLimit = checkContactRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many messages sent — please try again later" },
        { status: 429 }
      );
    }

    const { name, email, message } = await request.json();

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }
    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Please enter a message" }, { status: 400 });
    }
    if (name.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: "That's too long — please shorten it" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (error) {
      console.error("Error saving contact message:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    await sendProductEmail(
      SUPPORT_INBOX,
      contactMessageEmail(name.trim(), email.trim(), message.trim()),
      { replyTo: email.trim() }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling contact form:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
