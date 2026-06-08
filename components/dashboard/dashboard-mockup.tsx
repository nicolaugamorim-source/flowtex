"use client";

import React from "react";
import {
  Mail,
  Calendar,
  Database,
  HardDrive,
  Home,
  CheckSquare,
  Settings,
  LogOut,
  Search,
  Zap,
  Clock,
  MapPin,
  Plus
} from "lucide-react";

export const DashboardMockup = () => {
  return (
    <div className="flex h-[600px] rounded-3xl border border-[#C8D8E6] overflow-hidden shadow-sm bg-[#F8FAFC]">
      {/* SIDEBAR */}
      <div className="w-64 border-r border-[#C8D8E6] bg-[#F8FAFC] flex flex-col py-6 px-5">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00D4A4] flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-[#0D1F2D]" />
          </div>
          <span className="font-semibold text-[#0D1F2D] text-sm">Flowtex</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8 flex-1">
          <NavItem icon={<Home size={18} />} label="Home" active />
          <NavItem icon={<CheckSquare size={18} />} label="Projects" />
          <NavItem icon={<Mail size={18} />} label="Messages" />
          <NavItem icon={<Calendar size={18} />} label="Calendar" />
        </nav>

        {/* Projects List */}
        <div className="border-t border-[#C8D8E6] pt-4 mb-4">
          <p className="text-xs font-medium text-[#4A6880] px-3 mb-3">ACTIVE PROJECTS</p>
          <div className="space-y-2">
            <ProjectItem name="Website Redesign" color="#00D4A4" active />
            <ProjectItem name="Mobile App" color="#3B82F6" />
            <ProjectItem name="API Integration" color="#F59E0B" />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 border-t border-[#C8D8E6] pt-4">
          <NavItem icon={<Settings size={18} />} label="Settings" />
          <NavItem icon={<LogOut size={18} />} label="Sign out" />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div className="border-b border-[#C8D8E6] bg-[#F8FAFC] px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-[#4A6880]" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#C8D8E6] bg-white text-sm text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:border-[#00D4A4]"
              />
            </div>
          </div>

          {/* Integration Status */}
          <div className="flex items-center gap-4">
            <IntegrationBadge icon={<Mail size={16} />} label="Gmail" connected />
            <IntegrationBadge icon={<Calendar size={16} />} label="Calendar" connected />
            <IntegrationBadge icon={<Database size={16} />} label="Notion" connected />
            <IntegrationBadge icon={<HardDrive size={16} />} label="Drive" connected />
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col justify-end gap-6">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-md">
              <div className="bg-[#00D4A4] text-[#0D1F2D] px-4 py-3 rounded-2xl rounded-tr-lg text-sm font-medium">
                Schedule a call with Acme on Friday at 3pm
              </div>
              <p className="text-xs text-[#4A6880] mt-1 text-right">Now</p>
            </div>
          </div>

          {/* AI Response - Calendar Event Card */}
          <div className="flex justify-start">
            <div className="max-w-md space-y-3">
              <p className="text-sm text-[#2E4A62]">
                I've created the calendar event for you:
              </p>

              {/* Calendar Card */}
              <div className="bg-[#E8EFF5] border border-[#C8D8E6] rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#00D4A4] uppercase tracking-wide mb-1">
                    Calendar Event
                  </p>
                  <p className="font-semibold text-[#0D1F2D] text-sm">Acme Call</p>
                </div>

                <div className="bg-white rounded-xl p-3 space-y-2 border border-[#C8D8E6]">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-[#00D4A4] mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-[#0D1F2D]">
                      <p className="font-medium">Friday, Jan 12</p>
                      <p className="text-[#4A6880]">3:00 PM – 4:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[#4A6880] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#0D1F2D]">Google Meet</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-[#4A6880] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#0D1F2D]">contact@acme.com</p>
                  </div>

                  <div className="pt-2 border-t border-[#C8D8E6] flex gap-2">
                    <button className="flex-1 px-3 py-2 rounded-lg bg-[#E0F7F2] text-[#00D4A4] text-xs font-medium hover:bg-[#00D4A4]/10 transition-colors">
                      View in Calendar
                    </button>
                    <button className="flex-1 px-3 py-2 rounded-lg border border-[#C8D8E6] text-[#2E4A62] text-xs font-medium hover:bg-[#DDE6EF] transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-lg border border-[#C8D8E6] bg-white text-[#2E4A62] text-xs font-medium hover:bg-[#F8FAFC] transition-colors">
                  <Zap size={14} className="inline mr-1" /> More
                </button>
                <button className="px-3 py-2 rounded-lg border border-[#C8D8E6] bg-white text-[#2E4A62] text-xs font-medium hover:bg-[#F8FAFC] transition-colors">
                  👍
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="border-t border-[#C8D8E6] bg-[#F8FAFC] px-8 py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Ask Flowtex anything... 'Schedule...', 'Create...', 'Send...'"
                className="w-full px-4 py-3 rounded-xl border border-[#C8D8E6] bg-white text-sm text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:border-[#00D4A4]"
              />
            </div>
            <button className="p-3 rounded-xl bg-[#00D4A4] text-[#0D1F2D] hover:bg-[#00A882] transition-colors flex-shrink-0">
              <Zap size={18} />
            </button>
          </div>
          <p className="text-xs text-[#4A6880] mt-2">
            Flowtex is connected to all your tools and remembers your business context.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Components

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active }) => (
  <button
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-[#E0F7F2] text-[#00D4A4]"
        : "text-[#2E4A62] hover:bg-[#E8EFF5]"
    }`}
  >
    {icon}
    {label}
  </button>
);

interface ProjectItemProps {
  name: string;
  color: string;
  active?: boolean;
}

const ProjectItem: React.FC<ProjectItemProps> = ({ name, color, active }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
      active ? "bg-[#E8EFF5] border border-[#C8D8E6]" : "hover:bg-[#E8EFF5]"
    }`}
  >
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span className={`text-sm font-medium truncate ${
      active ? "text-[#0D1F2D]" : "text-[#2E4A62]"
    }`}>
      {name}
    </span>
  </div>
);

interface IntegrationBadgeProps {
  icon: React.ReactNode;
  label: string;
  connected?: boolean;
}

const IntegrationBadge: React.FC<IntegrationBadgeProps> = ({ icon, label, connected }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#C8D8E6]">
    <div className="text-[#2E4A62]">
      {icon}
    </div>
    <span className="text-xs font-medium text-[#2E4A62]">{label}</span>
    {connected && (
      <div className="w-2 h-2 rounded-full bg-[#00D4A4]" />
    )}
  </div>
);
