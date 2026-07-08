"use client";

// Shared destructive-action confirmation modal — replaces the old "click the
// trash icon twice" pattern (too easy to trigger by accident/double-click)
// with a real dialog: confirm -> loading -> success, auto-closing after a
// couple of seconds. Matches the overlay/card styling of ClientFormModal.
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

type Phase = "confirm" | "deleting" | "success";

const SUCCESS_AUTOCLOSE_MS = 2500;

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Performs the actual delete; return true on success, false on failure (the caller is expected to already surface a toast explaining the failure). */
  onConfirm: () => Promise<boolean>;
  title: string;
  description: string;
  successMessage?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  successMessage = "Deleted",
}: ConfirmDeleteModalProps) {
  const [phase, setPhase] = useState<Phase>("confirm");

  useEffect(() => {
    if (isOpen) setPhase("confirm");
  }, [isOpen]);

  useEffect(() => {
    if (phase !== "success") return;
    const timer = setTimeout(onClose, SUCCESS_AUTOCLOSE_MS);
    return () => clearTimeout(timer);
  }, [phase, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setPhase("deleting");
    const success = await onConfirm();
    setPhase(success ? "success" : "confirm");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-[var(--space-4)]"
      onClick={() => phase !== "deleting" && onClose()}
    >
      <div
        className="bg-[var(--color-bg-card)] rounded-[var(--radius-xl)] p-[var(--space-6)] max-w-[clamp(320px,32vw,420px)] w-full border border-[var(--color-border-default)]"
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "success" ? (
          <div className="flex flex-col items-center text-center py-[var(--space-4)]">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-[var(--space-3)]"
              style={{ backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}
            >
              <Check size={24} />
            </div>
            <p className="text-[length:var(--text-base)] font-semibold text-[var(--color-text-primary)]">{successMessage}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-[var(--space-4)]">
              <div className="flex items-center gap-[var(--space-3)]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--color-error-bg)", color: "var(--color-error)" }}
                >
                  <AlertTriangle size={18} />
                </div>
                <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{title}</h2>
              </div>
              {phase !== "deleting" && (
                <button
                  onClick={onClose}
                  className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <p className="text-[length:var(--text-sm)] text-[var(--color-text-muted)] mb-[var(--space-6)]">{description}</p>

            <div className="flex justify-end gap-[var(--space-3)]">
              <button
                onClick={onClose}
                disabled={phase === "deleting"}
                className="px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-md)] text-[length:var(--text-sm)] font-medium text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-elevated)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={phase === "deleting"}
                className="px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-md)] text-[length:var(--text-sm)] font-medium text-white flex items-center gap-[var(--space-2)] disabled:opacity-70"
                style={{ backgroundColor: "var(--color-error)" }}
              >
                {phase === "deleting" && <Loader2 size={14} className="animate-spin" />}
                {phase === "deleting" ? "Deleting…" : "Delete"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
