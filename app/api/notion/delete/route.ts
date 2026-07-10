import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { deleteNotionPage } from "@/lib/notion";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

// Deletes (archives) a Notion page for the authenticated user. Confirm-and-execute
// step for the chat assistant's delete_notion_page tool: the tool only returns the
// candidate page to the UI, and this route performs the actual deletion only once
// the user clicks "Confirm delete" (mirrors app/api/gmail/delete).
export async function POST(request: NextRequest) {
  try {
    const subscriptionCheck = await checkSubscriptionAPI(request);
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.error || NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

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
      console.error("[DELETE NOTION PAGE] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await request.json();

    if (!pageId) {
      console.error("[DELETE NOTION PAGE] Missing pageId");
      return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
    }

    console.log(`[DELETE NOTION PAGE] Deleting page ${pageId} for user ${user.id}`);

    await deleteNotionPage(user.id, pageId);

    console.log(`[DELETE NOTION PAGE] Successfully deleted page: ${pageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE NOTION PAGE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
