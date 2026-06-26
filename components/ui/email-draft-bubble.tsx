"use client";

import React from "react";
import { motion } from "framer-motion";
import { Send, RotateCcw } from "lucide-react";

export interface EmailDraftBubbleProps {
  to: string;
  subject: string;
  body: string;
  onConfirm: () => void;
  onRemake: () => void;
  isLoading?: boolean;
}

export const EmailDraftBubble = React.forwardRef<HTMLDivElement, EmailDraftBubbleProps>(
  ({ to, subject, body, onConfirm, onRemake, isLoading = false }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[var(--color-bg-base)] border-b border-[var(--color-border-subtle)] p-4">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
            Email Draft
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">To:</span>
              <p className="text-sm text-[var(--color-text-primary)]">{to}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Subject:</span>
              <p className="text-sm text-[var(--color-text-primary)] font-medium">{subject}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 bg-[var(--color-bg-card)]">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
            Message
          </div>
          <div className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[var(--color-bg-base)] border-t border-[var(--color-border-subtle)] p-4 flex gap-3 justify-end">
          <button
            onClick={onRemake}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-lg hover:bg-[var(--color-bg-base)] hover:border-[var(--color-border-strong)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Remake
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Sending..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    );
  }
);

EmailDraftBubble.displayName = "EmailDraftBubble";
