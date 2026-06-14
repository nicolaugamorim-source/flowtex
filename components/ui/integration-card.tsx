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
          "group relative overflow-hidden rounded-xl border border-[#E2EAF1] bg-white transition-all duration-300",
          "hover:border-[#00D4A4] hover:shadow-lg hover:shadow-[#00D4A4]/10",
          className
        )}
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4A4]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg group-hover:bg-[#00D4A4]/10 transition-colors duration-300">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#0D1F2D]">{name}</h3>
                <p className="text-sm text-[#4A6880] mt-1">{description}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC] group-hover:bg-[#00D4A4]/10 transition-colors duration-300">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-[#4A6880]/40" />
                  <span className="text-xs font-medium text-[#4A6880]">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#E2EAF1]" />

          {/* Content */}
          <div className="space-y-3">
            {children}
          </div>

          {/* Connect Button */}
          {onConnect && !isConnected && (
            <button
              onClick={onConnect}
              disabled={isLoading}
              className="w-full mt-4 px-4 py-2 bg-[#00D4A4] hover:bg-[#00C494] disabled:bg-[#00D4A4]/50 text-white font-medium rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>

        {/* Accent line on top for connected state */}
        {isConnected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00D4A4] to-transparent" />
        )}
      </motion.div>
    );
  }
);

IntegrationCard.displayName = "IntegrationCard";
