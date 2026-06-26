"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Home,
  CheckSquare,
  Mail,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelRightClose,
  Users,
} from "lucide-react";

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`${
        isExpanded ? "w-64" : "w-20"
      } border-r border-[var(--color-border-default)] bg-[var(--color-bg-base)] flex flex-col transition-all duration-300 ${className}`}
    >
      {/* Top Section */}
      <div className="px-5 py-6 flex items-center justify-between">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[var(--color-text-primary)]" />
            </div>
            <span className="font-semibold text-[var(--color-text-primary)] text-sm">Flowtex</span>
          </div>
        )}
        {!isExpanded && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[var(--color-text-primary)]" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-[var(--color-bg-card)] rounded-lg transition-colors"
        >
          {isExpanded ? <PanelLeftClose size={20} /> : <PanelRightClose size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        <NavLink icon={<Home size={20} />} label="Home" active={isExpanded} />
        <NavLink icon={<CheckSquare size={20} />} label="Projects" expanded={isExpanded} />
        <NavLink icon={<Mail size={20} />} label="Messages" expanded={isExpanded} />
        <NavLink icon={<Calendar size={20} />} label="Calendar" expanded={isExpanded} />
        <NavLink icon={<Users size={20} />} label="Clients" expanded={isExpanded} href="/app/clients" />
        <NavLink icon={<BarChart3 size={20} />} label="Analytics" expanded={isExpanded} />
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-card)] transition-colors">
          Feedback
        </button>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-[var(--color-border-default)] px-3 py-4 space-y-2">
        <NavLink icon={<Settings size={20} />} label="Settings" expanded={isExpanded} />
        <NavLink icon={<LogOut size={20} />} label="Sign out" expanded={isExpanded} />
      </div>
    </div>
  );
};

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  expanded?: boolean;
  active?: boolean;
  href?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, expanded = true, active = false, href }) => {
  const content = (
    <>
      {icon}
      {expanded && <span>{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href}>
        <div
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            active
              ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]"
          } ${!expanded && "justify-center"}`}
        >
          {content}
        </div>
      </Link>
    );
  }

  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]"
      } ${!expanded && "justify-center"}`}
    >
      {content}
    </button>
  );
};
