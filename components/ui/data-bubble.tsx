"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetadataItem {
  icon?: LucideIcon;
  label: string;
  value: string;
  color?: "default" | "accent" | "success" | "warning" | "error" | "info";
}

export interface DataBubbleAction {
  label: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "danger";
}

export interface DataBubbleProps {
  // Type identifies the integration (for icon & styling)
  type: "email" | "event" | "task" | "notion" | "slack" | "custom";

  // Visual elements
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  description?: string;

  // Organized metadata (e.g., date, sender, etc)
  metadata?: MetadataItem[];

  // Optional badge/status
  badge?: {
    label: string;
    color?: "default" | "accent" | "success" | "warning" | "error" | "info";
  };

  // Actions
  actions?: DataBubbleAction[];
  actionLabel?: string; // Default action label

  // Styling
  variant?: "default" | "compact";
  className?: string;
}

// Type icons mapping — reuses the same palette as the kanban columns/tags.
// No new colors, no teal accent.
const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  email: {
    icon: require("lucide-react").Mail,
    color: "var(--color-category-bug-text)",
    bg: "var(--color-category-bug-bg)",
  },
  event: {
    icon: require("lucide-react").Calendar,
    color: "var(--color-category-client-text)",
    bg: "var(--color-category-client-bg)",
  },
  task: {
    icon: require("lucide-react").CheckCircle2,
    color: "var(--color-text-primary)",
    bg: "var(--color-bg-elevated)",
  },
  notion: {
    icon: require("lucide-react").Database,
    color: "var(--color-category-idea-text)",
    bg: "var(--color-category-idea-bg)",
  },
  slack: {
    icon: require("lucide-react").MessageCircle,
    color: "var(--color-category-idea-text)",
    bg: "var(--color-category-idea-bg)",
  },
  custom: {
    icon: require("lucide-react").Zap,
    color: "var(--color-text-primary)",
    bg: "var(--color-bg-elevated)",
  },
};

// Color mappings for metadata badges
const COLOR_CLASSES: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  default: {
    text: "var(--color-text-primary)",
    bg: "var(--color-bg-secondary)",
    border: "var(--color-border-subtle)",
  },
  accent: {
    text: "var(--color-category-client-text)",
    bg: "var(--color-category-client-bg)",
    border: "var(--color-category-client-text)",
  },
  success: {
    text: "var(--color-success)",
    bg: "var(--color-bg-secondary)",
    border: "var(--color-success)",
  },
  warning: {
    text: "var(--color-warning)",
    bg: "var(--color-bg-secondary)",
    border: "var(--color-warning)",
  },
  error: {
    text: "var(--color-category-bug-text)",
    bg: "var(--color-category-bug-bg)",
    border: "var(--color-category-bug-text)",
  },
  info: {
    text: "var(--color-category-idea-text)",
    bg: "var(--color-category-idea-bg)",
    border: "var(--color-category-idea-text)",
  },
};

export function DataBubble({
  type = "custom",
  icon: customIcon,
  title,
  subtitle,
  description,
  metadata = [],
  badge,
  actions = [],
  actionLabel = "View",
  variant = "default",
  className,
}: DataBubbleProps) {
  const typeConfig = TYPE_ICONS[type];
  const Icon = customIcon || typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-[var(--color-border-default)]",
        "bg-[var(--color-bg-card)] border-[var(--color-border-subtle)]",
        variant === "compact" ? "max-w-sm" : "w-full max-w-2xl",
        className
      )}
    >
      {/* Header Section */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Type Icon + Title + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Type Icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: typeConfig.bg }}
            >
              <Icon className="w-5 h-5" style={{ color: typeConfig.color }} />
            </div>

            {/* Title + Subtitle */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--color-text-primary)] truncate text-sm sm:text-base">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor:
                  COLOR_CLASSES[badge.color || "default"].bg,
                color: COLOR_CLASSES[badge.color || "default"].text,
                borderColor:
                  COLOR_CLASSES[badge.color || "default"].border,
                borderWidth: "1px",
              }}
            >
              {badge.label}
            </motion.div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Metadata Grid */}
        {metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {metadata.map((item, idx) => {
              const MetaIcon = item.icon;
              const colorClass =
                COLOR_CLASSES[item.color || "default"];

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-2.5 rounded-lg"
                  style={{
                    backgroundColor: colorClass.bg,
                    borderColor: colorClass.border,
                    borderWidth: "1px",
                  }}
                >
                  <div className="flex items-start gap-2">
                    {MetaIcon && (
                      <MetaIcon
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: colorClass.text }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium"
                        style={{ color: colorClass.text }}
                      >
                        {item.label}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5 opacity-80"
                        style={{ color: colorClass.text }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      {actions.length > 0 && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[var(--color-border-subtle)] pt-3 sm:pt-4 flex gap-2 flex-wrap">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              onClick={action.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium transition-all border",
                action.variant === "outline"
                  ? "border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-secondary)] bg-transparent"
                  : action.variant === "secondary"
                    ? "border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]"
                    : action.variant === "danger"
                      ? ""
                      : "border-transparent text-white"
              )}
              style={
                action.variant === "danger"
                  ? {
                      borderColor: "var(--color-category-bug-text)",
                      color: "var(--color-category-bug-text)",
                      backgroundColor: "var(--color-category-bug-bg)",
                    }
                  : action.variant === "default" || !action.variant
                    ? { backgroundColor: "var(--color-accent)" }
                    : undefined
              }
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
