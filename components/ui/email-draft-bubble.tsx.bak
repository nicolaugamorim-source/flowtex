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
        className="rounded-lg border border-[#E2EAF1] bg-white shadow-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2EAF1] p-4">
          <div className="text-xs font-semibold text-[#4A6880] uppercase tracking-wide mb-3">
            Email Draft
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-semibold text-[#4A6880]">To:</span>
              <p className="text-sm text-[#0D1F2D]">{to}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#4A6880]">Subject:</span>
              <p className="text-sm text-[#0D1F2D] font-medium">{subject}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 bg-white">
          <div className="text-xs font-semibold text-[#4A6880] uppercase tracking-wide mb-3">
            Message
          </div>
          <div className="text-sm text-[#0D1F2D] leading-relaxed whitespace-pre-wrap">
            {body}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[#F8FAFC] border-t border-[#E2EAF1] p-4 flex gap-3 justify-end">
          <button
            onClick={onRemake}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4A6880] bg-white border border-[#E2EAF1] rounded-lg hover:bg-[#F8FAFC] hover:border-[#00D4A4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Remake
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00D4A4] rounded-lg hover:bg-[#00C494] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
