"use client";

import { LucideIcon } from "lucide-react";
import {
  Calendar,
  UserPlus,
  Lightbulb,
  CornerRightDown,
  Paperclip,
  Plus,
  ArrowUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";

interface ActionItem {
  text: string;
  icon: LucideIcon;
  colors: {
    icon: string;
    border: string;
    bg: string;
  };
}

interface AIInputWithSuggestionsProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  actions?: ActionItem[];
  defaultSelected?: string;
  onSubmit?: (text: string, action?: string) => void;
  className?: string;
}

const DEFAULT_ACTIONS: ActionItem[] = [
  {
    text: "Schedule Meeting",
    icon: Calendar,
    colors: {
      icon: "text-blue-600",
      border: "border-blue-500",
      bg: "bg-blue-100",
    },
  },
  {
    text: "Add client",
    icon: UserPlus,
    colors: {
      icon: "text-green-600",
      border: "border-green-500",
      bg: "bg-green-100",
    },
  },
  {
    text: "Add idea",
    icon: Lightbulb,
    colors: {
      icon: "text-yellow-600",
      border: "border-yellow-500",
      bg: "bg-yellow-100",
    },
  },
];

export function AIInputWithSuggestions({
  id = "ai-input-with-suggestions",
  placeholder = "Enter your text here...",
  minHeight = 64,
  maxHeight = 200,
  actions = DEFAULT_ACTIONS,
  defaultSelected,
  onSubmit,
  className,
}: AIInputWithSuggestionsProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(
    defaultSelected ?? null
  );
  const [textareaHeight, setTextareaHeight] = useState(minHeight);
  const [showScrollbar, setShowScrollbar] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

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

  const toggleItem = (itemText: string) => {
    setSelectedItem((prev) => (prev === itemText ? null : itemText));
  };

  const currentItem = selectedItem
    ? actions.find((item) => item.text === selectedItem)
    : null;

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit?.(inputValue, selectedItem ?? undefined);
      setInputValue("");
      setSelectedItem(null);
      adjustHeight(true);
    }
  };

  return (
    <>
      <style>{`
        .ai-input-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .ai-input-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-input-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-text-muted);
          border-radius: 4px;
        }
        .ai-input-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-secondary);
        }
      `}</style>
      <div className={cn("w-full", className)}>
        <div
          className="relative border border-[var(--color-border-subtle)] focus-within:border-[var(--color-border-default)] rounded-2xl transition-all duration-150"
          style={{ backgroundColor: "var(--color-surface)" }}
          style={{
            height: `${textareaHeight + 50}px`,
            paddingRight: showScrollbar ? '20px' : '0',
            paddingTop: showScrollbar ? '26px' : '0',
            paddingBottom: showScrollbar ? '26px' : '0',
            boxSizing: 'border-box'
          }}
        >
          <div className="flex flex-col h-full">
            {/* Top half - Text Input */}
            <Textarea
              ref={textareaRef}
              id={id}
              placeholder={placeholder}
              className={cn(
                "w-full px-4 pt-3.5 pb-3 placeholder:text-[var(--color-text-muted)]/50 border-none focus:ring text-[var(--color-text-primary)] resize-none text-wrap bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 leading-[1.2] text-lg",
                showScrollbar ? "overflow-y-auto ai-input-scrollbar" : "overflow-hidden"
              )}
              style={{
                minHeight: `${minHeight}px`,
                maxHeight: `${maxHeight}px`
              }}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />


            {currentItem && (
              <div className="absolute left-3 bottom-3 z-10">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    "border shadow-sm rounded-md px-2 py-0.5 text-xs font-medium",
                    "hover:opacity-80 transition-colors duration-200",
                    currentItem.colors.bg,
                    currentItem.colors.border
                  )}
                >
                  <currentItem.icon
                    className={`w-3.5 h-3.5 ${currentItem.colors.icon}`}
                  />
                  <span className={currentItem.colors.icon}>
                    {selectedItem}
                  </span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="absolute left-3 bottom-3 p-2 rounded-md hover:bg-[var(--color-border-subtle)] transition-colors duration-200 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            type="button"
            className="absolute right-3 bottom-3 p-2 rounded-lg transition-colors duration-200 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          style={{ backgroundColor: "var(--color-accent-bg)" }}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
