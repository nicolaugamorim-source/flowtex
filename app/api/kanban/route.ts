import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/posthog-server";
import { checkSubscriptionAPI } from "@/lib/protect-api-route";

// Lists/creates kanban tasks for the authenticated user.
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

    // Unbounded before — a power user's board (including everything they've
    // ever archived, since the frontend fetches both in one call) would grow
    // this response indefinitely. 1000 is far above any real board size today
    // and cheap insurance against that.
    const { data: tasks, error } = await supabase
      .from("kanban_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: false })
      .order("position", { ascending: true })
      .limit(1000);

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Column name mapping
    const columnNames: { [key: string]: string } = {
      "todo": "Backlog",
      "in_progress": "In Progress",
      "review": "Review",
      "done": "Done",
    };

    const tasksWithColumnName = (tasks ?? []).map((task: any) => ({
      ...task,
      column_name: columnNames[task.column_id] || task.column_id,
    }));

    return NextResponse.json({ tasks: tasksWithColumnName });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
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

    const { title, description, priority, column_id, category, due_date, tags } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get the next position for this column
    const { data: existingTasks } = await supabase
      .from("kanban_tasks")
      .select("position")
      .eq("user_id", user.id)
      .eq("column_id", column_id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = (existingTasks?.[0]?.position ?? -1) + 1;

    const { data: task, error } = await supabase
      .from("kanban_tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "medium",
        column_id: column_id || "todo",
        category: category || "task",
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await captureServerEvent(user.id, "kanban_task_created", { category: task.category, column_id: task.column_id });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
