"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, GripVertical, Trash2, Archive, Search, X, SlidersHorizontal } from "lucide-react";
import { trackActivity } from "@/lib/activity-tracker";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  column_id: string;
  category?: "task" | "client" | "idea" | "bug";
  due_date?: string;
  tags?: string[];
  position: number;
  archived?: boolean;
  archived_at?: string | null;
}

interface NewTaskForm {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: "task" | "client" | "idea" | "bug";
  column_id: string;
  due_date: string;
}

const COLUMNS = [
  { id: "todo", label: "Backlog", colorVar: "--color-column-backlog" },
  { id: "in_progress", label: "In Progress", colorVar: "--color-column-progress" },
  { id: "review", label: "Review", colorVar: "--color-column-review" },
  { id: "done", label: "Done", colorVar: "--color-column-done" },
];

const CATEGORIES = [
  { id: "task", label: "Task", bgVar: "--color-category-task-bg", textVar: "--color-category-task-text" },
  { id: "client", label: "Client", bgVar: "--color-category-client-bg", textVar: "--color-category-client-text" },
  { id: "idea", label: "Idea", bgVar: "--color-category-idea-bg", textVar: "--color-category-idea-text" },
  { id: "bug", label: "Bug", bgVar: "--color-category-bug-bg", textVar: "--color-category-bug-text" },
];

const priorityConfig = {
  low: { borderVar: "--color-priority-low-border", label: "Low", order: 3, textVar: "--color-priority-low-text" },
  medium: { borderVar: "--color-priority-medium-border", label: "Medium", order: 2, textVar: "--color-priority-medium-text" },
  high: { borderVar: "--color-priority-high-border", label: "High", order: 1, textVar: "--color-priority-high-text" },
};

const sortTasksByPriority = (tasks: Task[]) => {
  return [...tasks].sort((a, b) => {
    const aOrder = priorityConfig[a.priority].order;
    const bOrder = priorityConfig[b.priority].order;
    return aOrder - bOrder;
  });
};

const getCategoryColor = (category: string) => {
  return CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
};

const TaskCard = ({
  task,
  onDelete,
  onArchive,
  isDragging,
  deleteConfirmId,
  setDeleteConfirmId,
  onTitleUpdate,
  onTagUpdate,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  isDragging: boolean;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  onTitleUpdate: (taskId: string, newTitle: string) => void;
  onTagUpdate: (taskId: string, field: "category" | "priority", value: string) => void;
}) => {
  const isDoneColumn = task.column_id === "done";
  const [trashHovered, setTrashHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [openTagMenu, setOpenTagMenu] = useState<"category" | "priority" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const priorityBorderVar = priorityConfig[task.priority].borderVar;
  const categoryColor = getCategoryColor(task.category || "task");

  useEffect(() => {
    if (!openTagMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setOpenTagMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openTagMenu]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || editTitle === task.title) {
      setIsEditing(false);
      return;
    }

    const oldTitle = task.title;
    setIsEditing(false);

    // Update task in state immediately (optimistic update)
    onTitleUpdate(task.id, editTitle.trim());

    // Update in background
    try {
      await fetch(`/api/kanban/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
    } catch (err) {
      console.error("Failed to update task title:", err);
      // Rollback on error
      onTitleUpdate(task.id, oldTitle);
    }
  };

  const formatDueDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div
        className={`bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[10px] p-[14px] transition-all duration-200 ${
          isDragging
            ? "shadow-[0_8px_24px_rgba(0,0,0,0.12)] scale-[1.02] rotate-1"
            : "hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-1"
        } group border-l-4 relative`}
        style={{ borderLeftColor: `var(${priorityBorderVar})` }}
        onClick={() => setDeleteConfirmId(null)}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditTitle(task.title);
                    setIsEditing(false);
                  }
                }}
                className="w-full text-[15px] font-bold text-[var(--color-text-primary)] break-words bg-transparent border rounded px-2 py-1 focus:outline-none"
                style={{ borderColor: `var(${priorityBorderVar})` }}
              />
            ) : (
              <p
                onClick={() => setIsEditing(true)}
                className="text-[15px] font-bold text-[var(--color-text-primary)] break-words cursor-text hover:opacity-70 transition-opacity"
              >
                {task.title}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTagMenu(openTagMenu === "category" ? null : "category");
                  }}
                  className="text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: `var(${categoryColor.bgVar})`, color: `var(${categoryColor.textVar})` }}
                >
                  {categoryColor.label}
                </button>
                {openTagMenu === "category" && (
                  <div
                    ref={tagMenuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-1 z-20 bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-lg shadow-lg p-1.5 flex flex-col gap-1 min-w-[100px]"
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          onTagUpdate(task.id, "category", cat.id);
                          setOpenTagMenu(null);
                        }}
                        className="text-xs font-medium px-2 py-1 rounded-full text-left hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `var(${cat.bgVar})`, color: `var(${cat.textVar})` }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTagMenu(openTagMenu === "priority" ? null : "priority");
                  }}
                  className="text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: `var(${priorityBorderVar})20`,
                    color: `var(${priorityConfig[task.priority].textVar})`,
                  }}
                >
                  {priorityConfig[task.priority].label}
                </button>
                {openTagMenu === "priority" && (
                  <div
                    ref={tagMenuRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-1 z-20 bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-lg shadow-lg p-1.5 flex flex-col gap-1 min-w-[100px]"
                  >
                    {(Object.keys(priorityConfig) as Array<keyof typeof priorityConfig>).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          onTagUpdate(task.id, "priority", p);
                          setOpenTagMenu(null);
                        }}
                        className="text-xs font-medium px-2 py-1 rounded-full text-left hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: `var(${priorityConfig[p].borderVar})20`,
                          color: `var(${priorityConfig[p].textVar})`,
                        }}
                      >
                        {priorityConfig[p].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {task.description && (
              <p className="text-[11px] text-[var(--color-text-disabled)] mt-2 line-clamp-2">
                {task.description}
              </p>
            )}
            {task.due_date && (
              <p className="text-xs text-[var(--color-text-disabled)] mt-2">{formatDueDate(task.due_date)}</p>
            )}
          </div>
          <button
            data-trash-button="true"
            onClick={(e) => {
              e.stopPropagation();
              if (deleteConfirmId === task.id) {
                if (isDoneColumn) {
                  onArchive(task.id);
                } else {
                  onDelete(task.id);
                }
                setDeleteConfirmId(null);
              } else {
                setDeleteConfirmId(task.id);
              }
            }}
            onMouseEnter={() => setTrashHovered(true)}
            onMouseLeave={() => setTrashHovered(false)}
            className="px-3 py-1.5 rounded-full transition-colors text-xs font-medium"
            style={{
              color: deleteConfirmId === task.id ? "var(--color-error)" : (trashHovered ? "var(--color-error)" : "var(--color-text-disabled)"),
              backgroundColor: deleteConfirmId === task.id ? "var(--color-delete-confirm-bg)" : (trashHovered ? "var(--color-delete-hover-bg)" : "transparent"),
              cursor: "pointer",
              border: deleteConfirmId === task.id ? "1px solid var(--color-error)" : "none",
            }}
          >
            {deleteConfirmId === task.id
              ? (isDoneColumn ? "Archive?" : "Delete?")
              : (isDoneColumn ? <Archive size={18} /> : <Trash2 size={18} />)}
          </button>
        </div>
      </div>

    </div>
  );
};

const AddTaskCard = ({
  columnId,
  onSubmit,
  onCancel,
}: {
  columnId: string;
  onSubmit: (title: string, priority: string, category: string) => void;
  onCancel: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("low");
  const [category, setCategory] = useState("task");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (title.trim()) {
        onSubmit(title, priority, category);
        setTitle("");
        setPriority("low");
        setCategory("task");
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const priorityBorderVar = priorityConfig[priority as keyof typeof priorityConfig].borderVar;

  return (
    <div
      className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[10px] p-[14px] border-l-4 transition-colors"
      style={{ borderLeftColor: `var(${priorityBorderVar})` }}
    >
      <div className="mb-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-[15px] font-bold text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] bg-transparent focus:outline-none break-words"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
        >
          <option value="task">Task</option>
          <option value="client">Client</option>
          <option value="idea">Idea</option>
          <option value="bug">Bug</option>
        </select>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => {
            if (title.trim()) {
              onSubmit(title, priority, category);
              setTitle("");
              setPriority("low");
              setCategory("task");
            }
          }}
          className="flex-1 px-2 py-1.5 text-xs font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-2 py-1.5 text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-disabled)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const EmptyColumn = ({ onAddTask }: { onAddTask: () => void }) => (
  <button
    onClick={onAddTask}
    className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-[10px] border-2 border-dashed border-[var(--color-border-default)] hover:border-[var(--color-accent)] transition-colors group"
  >
    <Plus size={20} className="text-[var(--color-border-default)] group-hover:text-[var(--color-accent)]" />
    <p className="text-xs text-[var(--color-text-disabled)] group-hover:text-[var(--color-text-primary)] font-medium">No tasks</p>
  </button>
);

interface FilterPopoverProps {
  selectedCategories: string[];
  selectedPriorities: string[];
  onCategoryChange: (categories: string[]) => void;
  onPriorityChange: (priorities: string[]) => void;
  onClearFilters: () => void;
}

const FilterPopover = ({
  selectedCategories,
  selectedPriorities,
  onCategoryChange,
  onPriorityChange,
  onClearFilters,
}: FilterPopoverProps) => {
  const hasActiveFilters = selectedCategories.length > 0 || selectedPriorities.length > 0;

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const togglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  const priorityColors = {
    low: { bg: "#C4D6E3", text: "#5A7A8F" },
    medium: { bg: "#FFBF4D", text: "#8A6200" },
    high: { bg: "#F47560", text: "#A83220" },
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[0.5px] border-[var(--color-border-default)] rounded-[12px] p-4 w-60 shadow-lg">
      {/* Category Section */}
      <div>
        <p className="text-xs font-600 text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Category
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: isSelected ? `var(${category.bgVar})` : "var(--color-bg-secondary)",
                  color: isSelected ? `var(${category.textVar})` : "var(--color-text-muted)",
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border-subtle)] mb-4"></div>

      {/* Priority Section */}
      <div>
        <p className="text-xs font-600 text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Priority
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Low", "Medium", "High"].map((priority) => {
            const value = priority.toLowerCase() as "low" | "medium" | "high";
            const isSelected = selectedPriorities.includes(value);
            const colors = priorityColors[value];
            return (
              <button
                key={value}
                onClick={() => togglePriority(value)}
                className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: isSelected ? colors.bg : "var(--color-bg-secondary)",
                  color: isSelected ? colors.text : "var(--color-text-muted)",
                }}
              >
                {priority}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-xs text-[var(--color-accent)] font-medium hover:opacity-80 transition-opacity"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [addingTaskInColumn, setAddingTaskInColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"kanban" | "archived">("kanban");

  const [newTaskForm, setNewTaskForm] = useState<NewTaskForm>({
    title: "",
    description: "",
    priority: "medium",
    category: "task",
    column_id: "todo",
    due_date: "",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  // Refresh in the background when a task is created/moved via the AI chat,
  // so the board updates without the user needing to reload the page.
  useEffect(() => {
    const handleKanbanUpdated = () => fetchTasks(true);
    window.addEventListener("flowtex:kanban-updated", handleKanbanUpdated);
    return () => window.removeEventListener("flowtex:kanban-updated", handleKanbanUpdated);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setShowFilterPopover(false);
      }
    };

    if (showFilterPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFilterPopover]);

  const fetchTasks = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch("/api/kanban");
      const data = await response.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.archived) return false;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(task.category || "task");
      const matchesPriority =
        selectedPriorities.length === 0 || selectedPriorities.includes(task.priority);
      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [tasks, searchQuery, selectedCategories, selectedPriorities]);

  const archivedTasks = useMemo(() => {
    return tasks
      .filter((task) => task.archived)
      .sort((a, b) => {
        const aTime = a.archived_at ? new Date(a.archived_at).getTime() : 0;
        const bTime = b.archived_at ? new Date(b.archived_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [tasks]);

  const completedCount = tasks.filter((t) => t.column_id === "done").length;
  const totalCount = tasks.length;
  const completionPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (!draggedTask) return;

    // Track activity if card moved forward
    const columnOrder = { 'todo': 0, 'in_progress': 1, 'review': 2, 'done': 3 };
    const fromIndex = columnOrder[source.droppableId as keyof typeof columnOrder] ?? -1;
    const toIndex = columnOrder[destination.droppableId as keyof typeof columnOrder] ?? -1;

    if (toIndex > fromIndex) {
      const columnsAdvanced = toIndex - fromIndex;
      trackActivity('task_moved', columnsAdvanced).catch((err) =>
        console.error('Failed to track task moved activity:', err)
      );
    }

    // Get all tasks in the destination column, sorted by priority and position
    const columnTasks = tasks
      .filter((t) => t.column_id === destination.droppableId)
      .sort((a, b) => {
        const aOrder = priorityConfig[a.priority].order;
        const bOrder = priorityConfig[b.priority].order;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.position - b.position;
      });

    // Insert the dragged task at the new position
    const newColumnTasks = columnTasks.filter((t) => t.id !== draggableId);
    newColumnTasks.splice(destination.index, 0, draggedTask);

    // Update positions for all tasks
    const updatedTasks = tasks.map((task) => {
      const newTask = newColumnTasks.find((t) => t.id === task.id);
      if (newTask) {
        const newIndex = newColumnTasks.indexOf(newTask);
        return {
          ...task,
          column_id: destination.droppableId,
          position: newIndex,
        };
      }
      return task;
    });

    setTasks(updatedTasks);

    try {
      await fetch(`/api/kanban/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          column_id: destination.droppableId,
          position: newColumnTasks.indexOf(draggedTask),
        }),
      });
    } catch (err) {
      console.error("Failed to update task:", err);
      fetchTasks();
    }
  };

  const handleAddTask = async (columnId: string, title: string, priority: string = "medium", category: string = "task") => {
    // Create optimistic task (temporary with random ID)
    const tempTask: Task = {
      id: `temp-${Date.now()}`,
      title,
      description: "",
      priority: priority as "low" | "medium" | "high",
      category: category as "task" | "client" | "idea" | "bug",
      column_id: columnId,
      position: tasks.filter(t => t.column_id === columnId).length,
    };

    // Add to UI immediately
    setTasks(prevTasks => [...prevTasks, tempTask]);
    setAddingTaskInColumn(null);

    // Upload to server in background
    try {
      const response = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: "",
          priority,
          category,
          column_id: columnId,
        }),
      });
      const data = await response.json();
      if (data.task) {
        // Replace temp task with real task from server
        setTasks(prevTasks => prevTasks.map(t => t.id === tempTask.id ? data.task : t));
        trackActivity('task_created', 1).catch((err) =>
          console.error('Failed to track task created activity:', err)
        );
      }
    } catch (err) {
      console.error("Failed to create task:", err);
      // Remove temp task on error
      setTasks(prevTasks => prevTasks.filter(t => t.id !== tempTask.id));
    }
  };

  const handleCreateTaskFromModal = async () => {
    if (!newTaskForm.title.trim()) return;

    try {
      const response = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskForm.title,
          description: newTaskForm.description,
          priority: newTaskForm.priority,
          category: newTaskForm.category,
          column_id: newTaskForm.column_id,
          due_date: newTaskForm.due_date || null,
        }),
      });
      const data = await response.json();
      if (data.task) {
        setTasks([...tasks, data.task]);
        trackActivity('task_created', 1).catch((err) =>
          console.error('Failed to track task created activity:', err)
        );
        setShowNewTaskModal(false);
        setNewTaskForm({
          title: "",
          description: "",
          priority: "medium",
          category: "task",
          column_id: "todo",
          due_date: "",
        });
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleTitleUpdate = (taskId: string, newTitle: string) => {
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, title: newTitle } : t
      )
    );
  };

  const handleTagUpdate = async (taskId: string, field: "category" | "priority", value: string) => {
    const previousTasks = tasks;
    setTasks(prevTasks =>
      prevTasks.map(t => (t.id === taskId ? { ...t, [field]: value } : t))
    );

    try {
      await fetch(`/api/kanban/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error(`Failed to update task ${field}:`, err);
      setTasks(previousTasks);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // Store the task in case we need to rollback
    const deletedTask = tasks.find(t => t.id === taskId);

    // Remove from UI immediately
    setTasks(tasks.filter((t) => t.id !== taskId));

    // Delete from server in background
    try {
      await fetch(`/api/kanban/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
      // Restore task on error
      if (deletedTask) {
        setTasks([...tasks, deletedTask]);
      }
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    const archivedAt = new Date().toISOString();
    const taskToArchive = tasks.find((t) => t.id === taskId);

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, archived: true, archived_at: archivedAt } : t
      )
    );

    try {
      await fetch(`/api/kanban/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true, archived_at: archivedAt }),
      });
    } catch (err) {
      console.error("Failed to archive task:", err);
      // Rollback on error
      if (taskToArchive) {
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === taskId ? taskToArchive : t))
        );
      }
    }
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) + (selectedCategories.length > 0 ? 1 : 0) + (selectedPriorities.length > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg-card)] border-b border-[var(--color-border-default)]">
        <div className="px-8 py-6 space-y-4">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1 className="text-[28px] font-bold text-[var(--color-text-primary)]">Kanban</h1>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-[var(--color-text-disabled)]" size={16} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Button with Popover */}
            <div className="relative" ref={filterPopoverRef}>
              <button
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className="relative px-3 py-2 text-xs border border-[0.5px] border-[var(--color-border-default)] rounded-lg bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <SlidersHorizontal size={16} />
                {activeFiltersCount > 0 && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></div>
                )}
              </button>

              {showFilterPopover && (
                <div className="absolute top-full right-0 mt-2 z-50">
                  <FilterPopover
                    selectedCategories={selectedCategories}
                    selectedPriorities={selectedPriorities}
                    onCategoryChange={setSelectedCategories}
                    onPriorityChange={setSelectedPriorities}
                    onClearFilters={() => {
                      setSelectedCategories([]);
                      setSelectedPriorities([]);
                      setSearchQuery("");
                    }}
                  />
                </div>
              )}
            </div>

            {/* Archived/Kanban Toggle */}
            <button
              onClick={() => setView(view === "kanban" ? "archived" : "kanban")}
              className="px-3 py-2 text-xs font-medium border border-[0.5px] border-[var(--color-border-default)] rounded-lg bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              {view === "kanban" ? "Archived" : "Kanban"}
            </button>
          </div>

          {/* Results count */}
          {activeFiltersCount > 0 && (
            <div className="text-xs text-[var(--color-text-disabled)]">
              Showing {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
            </div>
          )}
        </div>
      </div>

      {view === "archived" ? (
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Archived</h2>
          {archivedTasks.length === 0 ? (
            <p className="text-[var(--color-text-disabled)]">No archived tasks</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {archivedTasks.map((task) => {
                const categoryColor = getCategoryColor(task.category || "task");
                const priorityBorderVar = priorityConfig[task.priority].borderVar;
                const archivedDate = task.archived_at ? new Date(task.archived_at) : null;
                return (
                  <div
                    key={task.id}
                    className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[10px] p-[14px] border-l-4"
                    style={{ borderLeftColor: `var(${priorityBorderVar})` }}
                  >
                    <p className="text-[15px] font-bold text-[var(--color-text-primary)] break-words">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `var(${categoryColor.bgVar})`, color: `var(${categoryColor.textVar})` }}
                      >
                        {categoryColor.label}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `var(${priorityBorderVar})20`,
                          color: `var(${priorityConfig[task.priority].textVar})`,
                        }}
                      >
                        {priorityConfig[task.priority].label}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-[var(--color-text-disabled)] mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {archivedDate && (
                      <p className="text-xs text-[var(--color-text-disabled)] mt-3">
                        Archived: {archivedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                        {archivedDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-[var(--color-text-disabled)]">Loading...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="px-8 py-6 flex gap-4 w-full">
              {COLUMNS.map((column) => {
                const columnTasks = filteredTasks
                  .filter((t) => t.column_id === column.id)
                  .sort((a, b) => {
                    // First sort by priority
                    const aOrder = priorityConfig[a.priority].order;
                    const bOrder = priorityConfig[b.priority].order;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    // Then by position within same priority
                    return a.position - b.position;
                  });

                // Include a virtual "Add Task" item for DND
                const tasksWithAddButton = [
                  ...columnTasks,
                  { id: `add-task-${column.id}`, isAddTask: true } as any,
                ];

                return (
                  <div key={column.id} className="flex-1 min-w-0 flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-8 border-l-4 pl-4 h-10" style={{ borderLeftColor: `var(${column.colorVar})` }}>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                          {column.label}
                        </h2>
                        <span
                          className="text-xs font-medium px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: `var(${column.colorVar})` }}
                        >
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Body */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-[12px] p-3 flex-1 flex flex-col overflow-y-auto"
                          style={{ minHeight: "calc(100vh - 280px)" }}
                        >
                          <div className="space-y-2 flex-1">
                            {/* Tasks */}
                            {tasksWithAddButton.map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                                isDragDisabled={task.isAddTask}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...(provided.draggableProps as any)}
                                    {...(task.isAddTask ? {} : (provided.dragHandleProps as any))}
                                  >
                                    {task.isAddTask ? (
                                      addingTaskInColumn === column.id ? (
                                        <AddTaskCard
                                          columnId={column.id}
                                          onSubmit={(title, priority, category) =>
                                            handleAddTask(column.id, title, priority, category)
                                          }
                                          onCancel={() => setAddingTaskInColumn(null)}
                                        />
                                      ) : (
                                        <div
                                          onClick={() => setAddingTaskInColumn(column.id)}
                                          className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-[10px] p-[14px] transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:-translate-y-1 flex flex-col items-center justify-center gap-2 text-[var(--color-text-primary)] cursor-pointer"
                                        >
                                          <Plus size={20} />
                                          <span className="text-[13px] font-medium">Add Task</span>
                                        </div>
                                      )
                                    ) : (
                                      <TaskCard
                                        task={task}
                                        onDelete={handleDeleteTask}
                                        onArchive={handleArchiveTask}
                                        isDragging={snapshot.isDragging}
                                        deleteConfirmId={deleteConfirmId}
                                        setDeleteConfirmId={setDeleteConfirmId}
                                        onTitleUpdate={handleTitleUpdate}
                                        onTagUpdate={handleTagUpdate}
                                      />
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}

                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-card)] rounded-lg p-6 max-w-lg w-full shadow-lg border border-[var(--color-border-default)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">New Task</h2>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskForm.title}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-primary)] block mb-2">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add description..."
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] resize-none h-20"
                />
              </div>

              {/* Column, Priority, Category Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] block mb-2">
                    Column
                  </label>
                  <select
                    value={newTaskForm.column_id}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, column_id: e.target.value })
                    }
                    className="w-full px-2 py-2 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] block mb-2">
                    Priority
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        priority: e.target.value as "low" | "medium" | "high",
                      })
                    }
                    className="w-full px-2 py-2 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-primary)] block mb-2">
                    Category
                  </label>
                  <select
                    value={newTaskForm.category}
                    onChange={(e) =>
                      setNewTaskForm({
                        ...newTaskForm,
                        category: e.target.value as
                          | "task"
                          | "client"
                          | "idea"
                          | "bug",
                      })
                    }
                    className="w-full px-2 py-2 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                  >
                    <option value="task">Task</option>
                    <option value="client">Client</option>
                    <option value="idea">Idea</option>
                    <option value="bug">Bug</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-primary)] block mb-2">
                  Due Date (optional)
                </label>
                <input
                  type="date"
                  value={newTaskForm.due_date}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, due_date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-xs font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTaskFromModal}
                disabled={!newTaskForm.title.trim()}
                className="px-4 py-2 text-xs font-medium bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
