"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Note {
  id: string;
  content: string;
  is_done: boolean;
  created_at: string;
}

const SkeletonLoader = () => (
  <div className="animate-pulse space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white p-2 rounded h-10 flex items-center">
        <div className="h-3 flex-1 bg-[var(--color-border-default)] rounded" />
      </div>
    ))}
  </div>
);

const NoteItem = ({
  note,
  onToggleDone,
  onDelete,
}: {
  note: Note;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleDone = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: !note.is_done }),
      });

      if (response.ok) {
        onToggleDone(note.id);
      }
    } catch (err) {
      console.error("Failed to toggle note:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(note.id);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={handleToggleDone}
      className={`bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] px-3 py-2 rounded cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex items-center justify-between gap-3 transition-all ${
        isUpdating || isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <span
        className={`note-strike ${note.is_done ? "done text-[var(--color-text-disabled)]" : "text-[var(--color-text-primary)]"}`}
      >
        {note.content}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        disabled={isDeleting}
        className="flex-shrink-0 text-[var(--color-text-disabled)] hover:text-red-500 transition-colors disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export const QuickNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notes");
      const data = await response.json();

      if (response.ok && data.notes) {
        setNotes(data.notes);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!inputValue.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes([data.note, ...notes]);
        setInputValue("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleDone = (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, is_done: !note.is_done } : note
      )
    );
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  // Show all notes (done and undone)
  const displayNotes = notes.slice(0, 6);
  const moreCount = Math.max(0, notes.length - 6);

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-default)] p-6 h-full flex flex-col gap-3">
      <h3 className="text-[var(--color-text-primary)] text-xl font-semibold">Quick notes</h3>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleAddNote();
          }}
          placeholder="Capture a thought..."
          className="flex-1 px-3 py-2 bg-white border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          onClick={handleAddNote}
          disabled={isAdding || !inputValue.trim()}
          className="flex-shrink-0 w-10 h-10 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Notes list */}
      <div style={{ height: "280px" }} className="flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="overflow-y-auto flex-1">
            <SkeletonLoader />
          </div>
        ) : displayNotes.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="overflow-y-auto flex-1 space-y-1">
              {displayNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  onToggleDone={handleToggleDone}
                  onDelete={handleDelete}
                />
              ))}
              {moreCount > 0 && (
                <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
                  +{moreCount} more notes
                </p>
              )}
            </div>
            <p className="text-xs text-center text-[var(--color-text-disabled)] mt-auto pt-2">
              Click a note to mark it as done
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center flex-1">
              <p className="text-[var(--color-text-muted)] text-sm">Nothing captured yet</p>
            </div>
            <p className="text-xs text-center text-[var(--color-text-disabled)] mt-auto pt-2">
              Click a note to mark it as done
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
