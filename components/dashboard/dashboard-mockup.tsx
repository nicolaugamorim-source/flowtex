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
    <div className="flex h-[700px] rounded-3xl border border-[var(--color-border-default)] overflow-hidden shadow-sm bg-[var(--color-bg-base)]">
      {/* SIDEBAR - COMPACT */}
      <div className="w-20 border-r border-[var(--color-border-default)] bg-[var(--color-bg-base)] flex flex-col items-center py-6 px-3">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer">
            <div className="w-5 h-5 rounded-full bg-[var(--color-text-primary)]" />
          </div>
        </div>

        {/* Navigation Icons */}
        <nav className="space-y-3 mb-8 flex-1">
          <NavIconItem icon={<Home size={20} />} active />
          <NavIconItem icon={<CheckSquare size={20} />} />
          <NavIconItem icon={<Mail size={20} />} />
          <NavIconItem icon={<Calendar size={20} />} />
        </nav>

        {/* Projects Indicator Dots */}
        <div className="border-t border-[var(--color-border-default)] pt-4 mb-4 space-y-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" title="Website Redesign" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-info)]" title="Mobile App" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" title="API Integration" />
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 border-t border-[var(--color-border-default)] pt-4 mt-auto">
          <NavIconItem icon={<Settings size={20} />} />
          <NavIconItem icon={<LogOut size={20} />} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <div className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
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
              <div className="bg-[var(--color-accent)] text-[var(--color-text-primary)] px-4 py-3 rounded-2xl rounded-tr-lg text-sm font-medium">
                Schedule a call with Acme on Friday at 3pm
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">Now</p>
            </div>
          </div>

          {/* AI Response - Calendar Event Card */}
          <div className="flex justify-start">
            <div className="max-w-md space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)]">
                I've created the calendar event for you:
              </p>

              {/* Calendar Card */}
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-default)] rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide mb-1">
                    Calendar Event
                  </p>
                  <p className="font-semibold text-[var(--color-text-primary)] text-sm">Acme Call</p>
                </div>

                <div className="bg-[var(--color-bg-elevated)] rounded-xl p-3 space-y-2 border border-[var(--color-border-default)]">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-[var(--color-text-primary)]">
                      <p className="font-medium">Friday, Jan 12</p>
                      <p className="text-[var(--color-text-muted)]">3:00 PM – 4:00 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--color-text-primary)]">Google Meet</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail size={16} className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--color-text-primary)]">contact@acme.com</p>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border-default)] flex gap-2">
                    <button className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)]/10 transition-colors">
                      View in Calendar
                    </button>
                    <button className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg-elevated)] transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg-base)] transition-colors">
                  <Zap size={14} className="inline mr-1" /> More
                </button>
                <button className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg-base)] transition-colors">
                  👍
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="border-t border-[var(--color-border-default)] bg-[var(--color-bg-base)] px-8 py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Ask Flowtex anything... 'Schedule...', 'Create...', 'Send...'"
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <button className="p-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-hover)] transition-colors flex-shrink-0">
              <Zap size={18} />
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
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
        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]"
    }`}
  >
    {icon}
    {label}
  </button>
);

interface NavIconItemProps {
  icon: React.ReactNode;
  active?: boolean;
}

const NavIconItem: React.FC<NavIconItemProps> = ({ icon, active }) => (
  <button
    className={`p-3 rounded-lg transition-colors ${
      active
        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]"
    }`}
  >
    {icon}
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
      active ? "bg-[var(--color-bg-card)] border border-[var(--color-border-default)]" : "hover:bg-[var(--color-bg-card)]"
    }`}
  >
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    <span className={`text-sm font-medium truncate ${
      active ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
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
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
    <div className="text-[var(--color-text-secondary)]">
      {icon}
    </div>
    <span className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
    {connected && (
      <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
    )}
  </div>
);
