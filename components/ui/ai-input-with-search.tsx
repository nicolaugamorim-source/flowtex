"use client";

import { Paperclip, ArrowUp, Mail, Clock, CheckSquare2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

type ActionType = "email" | "schedule" | "todo" | null;

interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string, activeAction?: ActionType) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
}

const actionIcons = [
  { type: "email" as const, icon: Mail, label: "Email" },
  { type: "schedule" as const, icon: Clock, label: "Schedule" },
  { type: "todo" as const, icon: CheckSquare2, label: "To-do" },
];

export function AIInputWithSearch({
  id = "ai-input-with-search",
  placeholder = "What would you like to do?",
  minHeight = 50,
  maxHeight = 150,
  onSubmit,
  onFileSelect,
  className
}: AIInputWithSearchProps) {
  const [value, setValue] = useState("");
  const [textareaHeight, setTextareaHeight] = useState(minHeight);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const updateHeight = () => {
        const height = textarea.offsetHeight;
        setTextareaHeight(height);
        setShowScrollbar(height >= 120);
      };
      updateHeight();

      const observer = new ResizeObserver(updateHeight);
      observer.observe(textarea);
      return () => observer.disconnect();
    }
  }, [textareaRef]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit?.(value, activeAction);
      setValue("");
      adjustHeight(true);
      setActiveAction(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  const toggleAction = (actionType: ActionType) => {
    setActiveAction(activeAction === actionType ? null : actionType);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full">
        <div className="relative flex flex-col">
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: `${maxHeight}px`,
              scrollbarGutter: "stable"
            }}
          >
            <Textarea
              id={id}
              value={value}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-t-2xl px-4 pt-3.5 pb-3 bg-[#F8FAFC] border-none text-[#0D1F2D] placeholder:text-[#4A6880]/50 resize-none focus-visible:ring-0 leading-[1.2] text-lg",
                showScrollbar ? "overflow-y-auto pr-4" : "overflow-hidden"
              )}
              ref={textareaRef}
              style={{
                minHeight: `${minHeight}px`,
                maxHeight: `${maxHeight}px`
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
            />
          </div>

          <div className="h-12 bg-[#F8FAFC] rounded-b-2xl border-t border-[#E2EAF1] flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-lg p-2 hover:bg-[#E2EAF1] transition-colors">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Paperclip className="w-4 h-4 text-[#4A6880]" />
              </label>

              {/* Action Preset Icons */}
              <div className="flex items-center gap-1">
                {actionIcons.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleAction(type)}
                    className={cn(
                      "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8",
                      activeAction === type
                        ? "bg-[#E0F7F2] border-[#00D4A4] text-[#4A6880] scale-110"
                        : "bg-[#F1F5F9] border-transparent text-[#4A6880] hover:text-[#0D1F2D]"
                    )}
                  >
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <motion.div
                        animate={{
                          scale: activeAction === type ? 1.15 : 1,
                        }}
                        whileHover={{
                          scale: 1.15,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 10,
                          },
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 25,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {activeAction === type && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{
                            width: "auto",
                            opacity: 1,
                          }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm overflow-hidden whitespace-nowrap flex-shrink-0 text-[#4A6880]"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  value
                    ? "bg-[#00D4A4]/50"
                    : "bg-[#F1F5F9]"
                )}
              >
                <ArrowUp className="w-4 h-4 text-[#4A6880] stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
