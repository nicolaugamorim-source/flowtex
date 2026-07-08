"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  children: React.ReactNode;
  className?: string;
  onConnect?: () => void;
  isLoading?: boolean;
}

export const IntegrationCard = React.forwardRef<HTMLDivElement, IntegrationCardProps>(
  ({ name, description, icon, isConnected, children, className, onConnect, isLoading }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "group relative overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] transition-all duration-300",
          "hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-accent)]/10",
          className
        )}
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Fixed white chip — brand logos (e.g. Notion's dark mark) need a light
                  backdrop to stay visible regardless of the app's theme. */}
              <div className="p-2.5 bg-white rounded-lg group-hover:bg-[var(--color-accent)]/10 transition-colors duration-300">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{name}</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-base)] group-hover:bg-[var(--color-accent)]/10 transition-colors duration-300">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-success)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--color-success)" }}>Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-[var(--color-text-muted)]/40" />
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--color-border-subtle)]" />

          {/* Content */}
          <div className="space-y-3">
            {children}
          </div>

          {/* Connect Button */}
          {onConnect && !isConnected && (
            <button
              onClick={onConnect}
              disabled={isLoading}
              className="w-full mt-4 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] disabled:bg-[var(--color-accent)]/50 text-white font-medium rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>

        {/* Accent line on top for connected state */}
        {isConnected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-accent)] to-transparent" />
        )}
      </motion.div>
    );
  }
);

IntegrationCard.displayName = "IntegrationCard";
