"use client";

import { Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface EmailBubbleProps {
  subject: string;
  from: string;
  date: string;
  summary: string;
  language?: string;
}

export function EmailBubble({
  subject,
  from,
  date,
  summary,
  language = 'pt',
}: EmailBubbleProps) {
  const summaryTitle = language === 'pt' ? 'Resumo' : language === 'es' ? 'Resumen' : 'Summary';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg p-4 w-full max-w-sm bg-gradient-to-br from-[var(--color-bg-base)] to-[#EFF5FB] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <Mail className="w-5 h-5 text-[#6366F1] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-bold leading-snug mb-1 text-[var(--color-text-primary)]">
                {subject}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] font-medium truncate">{from}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-4 px-7">
        <Clock className="w-3 h-3" />
        <span>{date}</span>
      </div>

      {/* Summary */}
      <div className="bg-white/60 rounded-md p-3 border border-[var(--color-border-subtle)] mb-3">
        <p className="text-sm font-bold text-[var(--color-text-primary)] mb-2">{summaryTitle}</p>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#6366F1] bg-[#EEF2FF] px-2.5 py-1 rounded-md">
          Email
        </span>
      </div>
    </motion.div>
  );
}
