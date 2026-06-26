import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getValidGoogleToken } from "@/lib/google-auth";

// For every client with an email on file, finds the most recent email exchanged
// (sent or received) and returns how many days ago that was — a real "last contact"
// signal instead of just when the client record itself was last edited.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: clients } = await supabase
      .from("clients")
      .select("id, email")
      .eq("user_id", user.id);

    const accessToken = await getValidGoogleToken(supabase, user.id);

    const lastContact: Record<string, number | null> = {};

    if (!accessToken) {
      return NextResponse.json({ lastContact });
    }

    await Promise.all(
      (clients || [])
        .filter((c) => c.email)
        .map(async (c) => {
          try {
            const response = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
                `from:${c.email} OR to:${c.email}`
              )}&maxResults=1`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const data = await response.json();
            const messageId = data.messages?.[0]?.id;

            if (!messageId) {
              lastContact[c.id] = null;
              return;
            }

            const msgResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Date`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const msgData = await msgResponse.json();
            const dateHeader = msgData.payload?.headers?.find((h: any) => h.name === "Date")?.value;

            if (!dateHeader) {
              lastContact[c.id] = null;
              return;
            }

            const days = Math.floor((Date.now() - new Date(dateHeader).getTime()) / (1000 * 60 * 60 * 24));
            lastContact[c.id] = Math.max(days, 0);
          } catch {
            lastContact[c.id] = null;
          }
        })
    );

    return NextResponse.json({ lastContact });
  } catch (error) {
    console.error("Error computing last contact:", error);
    return NextResponse.json({ lastContact: {} }, { status: 200 });
  }
}
