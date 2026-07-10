import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getGravatarUrl } from "@/lib/gravatar";
import { captureServerEvent } from "@/lib/posthog-server";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lists/creates clients for the authenticated user (the CRM dashboard's data source).
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Unbounded before — 1000 is far above any real CRM list size today and
    // cheap insurance against unlimited growth degrading this endpoint.
    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const clientsWithAvatars = (clients || []).map((c) => ({ ...c, avatar_url: getGravatarUrl(c.email) }));

    return NextResponse.json({ clients: clientsWithAvatars });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, company, email, phone, website, status, notes, avatar_color } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (email && !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // Case-insensitive dupe check on name (+ email, when given) — cheap to run
    // here since it's a small per-user table, and it's the same signal a
    // human would use to spot "wait, didn't I already add this client?".
    const dupeQuery = supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", name);
    const { data: possibleDupes } = email
      ? await dupeQuery.ilike("email", email)
      : await dupeQuery;

    if (possibleDupes && possibleDupes.length > 0) {
      return NextResponse.json(
        { error: "A client with this name" + (email ? " and email" : "") + " already exists" },
        { status: 409 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .insert([
        {
          user_id: user.id,
          name,
          company: company || null,
          email: email || null,
          phone: phone || null,
          website: website || null,
          status: status || "active",
          notes: notes || null,
          avatar_color: avatar_color || "#00D4A4",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await captureServerEvent(user.id, "client_created", {
      status: client.status,
      has_email: Boolean(client.email),
      has_company: Boolean(client.company),
      source: "dashboard",
    });

    return NextResponse.json({ client: { ...client, avatar_url: getGravatarUrl(client.email) } }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
