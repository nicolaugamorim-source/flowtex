"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppCache } from "@/lib/app-cache";
import { Skeleton } from "@/components/ui/skeleton";
import { useFitCount } from "@/lib/use-fit-count";

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

// Text color paired with getColumnColor's background, so the badge stays legible
// in both themes instead of the fixed white text it used to have (invisible on
// the Backlog badge in light mode, since its background is plain white there).
const getColumnTextColor = (columnId: string): string => {
  const colorMap: Record<string, string> = {
    "todo": "var(--color-column-backlog-text)",
    "in_progress": "var(--color-column-progress-text)",
    "review": "var(--color-column-review-text)",
    "done": "var(--color-column-done-text)",
  };
  return colorMap[columnId] || "var(--color-column-backlog-text)";
};

const TaskSkeleton = () => (
  <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-2)]">
    <Skeleton style={{ width: 8, height: 8, borderRadius: "50%" }} />
    <Skeleton style={{ flex: 1, height: 12, borderRadius: "var(--radius-sm)" }} />
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
            .slice(0, 20); // keep a pool larger than any card could fit; useFitCount trims per-render

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

  const { ref: listRef, count: fitCount } = useFitCount<HTMLDivElement>(4, [isLoading]);
  const displayTasks = tasks.slice(0, fitCount);

  return (
    <div data-onboarding="tasks-card" className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] border border-[var(--color-border-default)] p-[var(--space-6)] h-full min-h-0 flex flex-col">
      <h3 className="text-[var(--color-text-primary)] text-[length:var(--text-lg)] font-semibold mb-[var(--space-4)]">
        Priority tasks
      </h3>

      <div className="flex-1 min-h-0 flex flex-col gap-[var(--space-3)] overflow-hidden" ref={listRef}>
        {isLoading ? (
          <>
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
            <TaskSkeleton />
          </>
        ) : displayTasks.length > 0 ? (
          displayTasks.map((task) => (
            <button
              key={task.id}
              onClick={handleTaskClick}
              className="bg-[var(--color-bg-elevated)] p-[var(--space-3)] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[length:var(--text-sm)] h-16 flex items-center justify-between gap-[var(--space-3)] hover:bg-[var(--color-surface-2)] transition-colors text-left border-l-4"
              style={{ borderLeftColor: getPriorityColor(task.priority) }}
            >
              <p className="font-medium text-[var(--color-text-primary)] truncate flex-1 min-w-0">
                {task.title}
              </p>

              <div
                className="text-[length:var(--text-xs)] font-medium px-[var(--space-2)] py-[var(--space-1)] rounded-full flex-shrink-0"
                style={{
                  backgroundColor: getColumnColor(task.column_id),
                  color: getColumnTextColor(task.column_id),
                }}
              >
                {task.column_name || task.column_id}
              </div>
            </button>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-[length:var(--text-sm)]">
            No pending tasks
          </div>
        )}
      </div>

      <Link
        href="/app/kanban"
        className="mt-[var(--space-4)] text-[length:var(--text-xs)] text-[var(--color-text-muted)] hover:underline font-medium"
      >
        View all tasks →
      </Link>
    </div>
  );
};
