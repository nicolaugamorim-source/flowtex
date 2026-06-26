import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/posthog-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const updateData: any = {};

    let fromColumn: string | null = null;
    if (body.column_id !== undefined) {
      const { data: existingTask } = await supabase
        .from("kanban_tasks")
        .select("column_id")
        .eq("id", id)
        .single();
      fromColumn = existingTask?.column_id ?? null;
      updateData.column_id = body.column_id;
    }
    if (body.position !== undefined) updateData.position = body.position;
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.archived !== undefined) updateData.archived = body.archived;
    if (body.archived_at !== undefined) updateData.archived_at = body.archived_at;
    updateData.updated_at = new Date().toISOString();

    const { data: task, error } = await supabase
      .from("kanban_tasks")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (fromColumn && fromColumn !== task.column_id) {
      await captureServerEvent(user.id, "kanban_task_moved", {
        from_column: fromColumn,
        to_column: task.column_id,
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const { error } = await supabase
      .from("kanban_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting task:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
