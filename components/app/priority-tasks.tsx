"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppCache } from "@/lib/app-cache";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  column_id: string;
  column_name?: string;
}

const priorityOrder = { high: 0, medium: 1, low: 2 };
const stateOrder = { review: 0, in_progress: 1, todo: 2 };

// Maps priority to CSS color variables (same as Kanban)
const getPriorityColor = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    "high": "var(--color-priority-high-border)",
    "medium": "var(--color-priority-medium-border)",
    "low": "var(--color-priority-low-border)",
  };
  return priorityMap[priority] || "var(--color-priority-low-border)";
};

// Maps column_id to CSS color variables
const getColumnColor = (columnId: string): string => {
  const colorMap: Record<string, string> = {
    "todo": "var(--color-column-backlog)",
    "in_progress": "var(--color-column-progress)",
    "review": "var(--color-column-review)",
    "done": "var(--color-column-done)",
  };
  return colorMap[columnId] || "var(--color-column-backlog)";
};

const TaskSkeleton = () => (
  <div className="flex items-center gap-2 mb-2">
    <Skeleton style={{ width: 8, height: 8, borderRadius: "50%" }} />
    <Skeleton style={{ flex: 1, height: 12, borderRadius: 4 }} />
    <Skeleton style={{ width: 60, height: 18, borderRadius: 999 }} />
  </div>
);

export const PriorityTasks = () => {
  const { cache, setCache, isStale } = useAppCache();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Check cache first (10 min max age)
        if (cache.kanbanTasks && !isStale("kanbanTasks", 10 * 60 * 1000)) {
          setTasks(cache.kanbanTasks);
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/kanban");
        const data = await response.json();

        if (data.tasks && Array.isArray(data.tasks)) {
          const filtered = data.tasks
            .filter((task: any) => task.column_id !== "done")
            .sort((a: Task, b: Task) => {
              // First sort by priority
              const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
              if (priorityDiff !== 0) return priorityDiff;
              // Then sort by state (review > progress > backlog)
              return (stateOrder[a.column_id as keyof typeof stateOrder] ?? 3) - (stateOrder[b.column_id as keyof typeof stateOrder] ?? 3);
            })
            .slice(0, 4);

          setTasks(filtered);
          setCache("kanbanTasks", filtered);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [cache, setCache, isStale]);

  const handleTaskClick = () => {
    router.push("/app/kanban");
  };

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col">
      <h3 className="text-[var(--color-text-primary)] text-xl font-semibold mb-4">
        Priority tasks
      </h3>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {isLoading ? (
          <>
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <button
              key={task.id}
              onClick={handleTaskClick}
              className="bg-[var(--color-bg-elevated)] p-3 rounded-lg border border-[var(--color-border-default)] text-sm h-16 flex items-center justify-between gap-3 hover:bg-[var(--color-bg-secondary)] transition-colors text-left border-l-4"
              style={{ borderLeftColor: getPriorityColor(task.priority) }}
            >
              <p className="font-medium text-[var(--color-text-primary)] truncate flex-1 min-w-0">
                {task.title}
              </p>

              <div
                className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 text-white"
                style={{
                  backgroundColor: getColumnColor(task.column_id),
                }}
              >
                {task.column_name || task.column_id}
              </div>
            </button>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
            No pending tasks
          </div>
        )}
      </div>

      <Link
        href="/app/kanban"
        className="mt-4 text-xs text-[var(--color-text-muted)] hover:underline font-medium"
      >
        View all tasks →
      </Link>
    </div>
  );
};
