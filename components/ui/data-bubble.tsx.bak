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
  variant?: "default" | "secondary" | "outline";
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

// Type icons mapping
const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  email: {
    icon: require("lucide-react").Mail,
    color: "#2E4A62",
    bg: "#E8EFF5",
  },
  event: {
    icon: require("lucide-react").Calendar,
    color: "#00D4A4",
    bg: "#E0F7F2",
  },
  task: {
    icon: require("lucide-react").CheckCircle2,
    color: "#22C55E",
    bg: "#ECFDF5",
  },
  notion: {
    icon: require("lucide-react").Database,
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  slack: {
    icon: require("lucide-react").MessageCircle,
    color: "#7C3AED",
    bg: "#F3E8FF",
  },
  custom: {
    icon: require("lucide-react").Zap,
    color: "#00D4A4",
    bg: "#E0F7F2",
  },
};

// Color mappings for metadata badges
const COLOR_CLASSES: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  default: {
    text: "#0D1F2D",
    bg: "#F1F5F9",
    border: "#E2EAF1",
  },
  accent: {
    text: "#00A882",
    bg: "#E0F7F2",
    border: "#00D4A4",
  },
  success: {
    text: "#16A34A",
    bg: "#F0FDF4",
    border: "#22C55E",
  },
  warning: {
    text: "#D97706",
    bg: "#FFFBEB",
    border: "#F59E0B",
  },
  error: {
    text: "#DC2626",
    bg: "#FEF2F2",
    border: "#EF4444",
  },
  info: {
    text: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#3B82F6",
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
        "rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg hover:border-[#C8D8E6]",
        "bg-white border-[#E2EAF1]",
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
              <h3 className="font-semibold text-[#0D1F2D] truncate text-sm sm:text-base">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs sm:text-sm text-[#4A6880] truncate mt-0.5">
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
          <p className="text-sm text-[#2E4A62] leading-relaxed line-clamp-3">
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
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-[#E2EAF1] pt-3 sm:pt-4 flex gap-2 flex-wrap">
          {actions.map((action, idx) => (
            <motion.button
              key={idx}
              onClick={action.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "text-xs sm:text-sm px-3 py-1.5 rounded-lg font-medium transition-all",
                action.variant === "outline"
                  ? "border border-[#E2EAF1] text-[#0D1F2D] hover:border-[#C8D8E6] hover:bg-[#F1F5F9]"
                  : action.variant === "secondary"
                    ? "bg-[#F1F5F9] text-[#0D1F2D] hover:bg-[#E8EFF5]"
                    : "bg-[#00D4A4] text-white hover:bg-[#00A882]"
              )}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
