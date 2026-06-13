"use client";

import React, { useState } from "react";
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
      } border-r border-[#C8D8E6] bg-[#F8FAFC] flex flex-col transition-all duration-300 ${className}`}
    >
      {/* Top Section */}
      <div className="px-5 py-6 flex items-center justify-between">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00D4A4] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#0D1F2D]" />
            </div>
            <span className="font-semibold text-[#0D1F2D] text-sm">Flowtex</span>
          </div>
        )}
        {!isExpanded && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#00D4A4] flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#0D1F2D]" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-[#E8EFF5] rounded-lg transition-colors"
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
        <NavLink icon={<BarChart3 size={20} />} label="Analytics" expanded={isExpanded} />
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-[#C8D8E6] px-3 py-4 space-y-2">
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
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, expanded = true, active = false }) => (
  <button
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-[#E0F7F2] text-[#00D4A4]"
        : "text-[#2E4A62] hover:bg-[#E8EFF5]"
    } ${!expanded && "justify-center"}`}
  >
    {icon}
    {expanded && <span>{label}</span>}
  </button>
);
