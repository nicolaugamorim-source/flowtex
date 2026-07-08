// Event bus + fake data used by the onboarding guide to narrate the Kanban page
// without touching the real backend. Demo tasks are pure client-side illustrations.
export const KANBAN_GUIDE_EVENT = "flowtex:kanban-guide";

export type KanbanGuideDetail =
  | { type: "inject-demo-tasks" }
  | { type: "clear-demo-tasks" }
  | { type: "task-created" }
  | { type: "view-changed"; view: "kanban" | "archived" }
  | { type: "demo-drag"; columnId: string; order: string[] };

export function emitKanbanGuideEvent(detail: KanbanGuideDetail) {
  window.dispatchEvent(new CustomEvent(KANBAN_GUIDE_EVENT, { detail }));
}

export interface DemoTask {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  category: "task" | "client" | "idea" | "bug";
  column_id: string;
  position: number;
}

// 1 high, 2 medium, 1 low — each with a different category "tag". Little easter eggs
// for anyone reading closely during onboarding, no two riffing on the same joke.
export const DEMO_TASKS: DemoTask[] = [
  { id: "demo-1", title: "Leave Flowtex a 5-star review", priority: "high", category: "task", column_id: "in_progress", position: 0 },
  { id: "demo-2", title: "Convince the team to ditch spreadsheets forever", priority: "medium", category: "client", column_id: "in_progress", position: 1 },
  { id: "demo-3", title: "Tell your boss you found the perfect tool", priority: "medium", category: "bug", column_id: "in_progress", position: 2 },
  { id: "demo-4", title: "Take over the world (after lunch)", priority: "low", category: "idea", column_id: "in_progress", position: 3 },
];
