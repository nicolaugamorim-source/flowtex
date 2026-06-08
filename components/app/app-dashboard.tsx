"use client";

import React from "react";
import {
  TrendingUp,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
  Database,
  ArrowRight,
} from "lucide-react";

export const AppDashboard = () => {
  return (
    <div className="p-8 flex-1 overflow-y-auto bg-[#F8FAFC]">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {/* Good Morning Card - 1/4 width */}
        <div className="col-span-1 bg-gradient-to-br from-[#E0F7F2] to-[#E8EFF5] rounded-2xl border border-[#C8D8E6] p-6 flex flex-col justify-between">
          <div>
            <p className="text-[#4A6880] text-sm font-medium mb-1">Welcome back</p>
            <h2 className="text-[#0D1F2D] text-2xl font-semibold">Good morning,</h2>
            <p className="text-[#2E4A62] text-lg font-medium">Nicolau</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[#00D4A4] text-sm font-medium cursor-pointer hover:gap-3 transition-all">
            View profile <ArrowRight size={16} />
          </div>
        </div>

        {/* App Status Card - 3/4 width */}
        <div className="col-span-3 bg-white rounded-2xl border border-[#C8D8E6] p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#4A6880] text-sm font-medium mb-1">App Status</p>
              <h3 className="text-[#0D1F2D] text-xl font-semibold">All Systems Operational</h3>
              <p className="text-[#2E4A62] text-sm mt-1">✓ All integrations connected and synced</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[#22C55E] text-sm font-medium">Live</span>
            </div>
          </div>

          {/* Integration Status Grid */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            <StatusBadge icon={<Mail size={16} />} label="Gmail" status="Connected" />
            <StatusBadge icon={<Calendar size={16} />} label="Calendar" status="Connected" />
            <StatusBadge icon={<Database size={16} />} label="Notion" status="Connected" />
            <StatusBadge icon={<Database size={16} />} label="Drive" status="Connected" />
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Card 1: Context Summary */}
        <div className="bg-white rounded-2xl border border-[#C8D8E6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#E0F7F2]">
              <Zap size={18} className="text-[#00D4A4]" />
            </div>
            <h3 className="text-[#0D1F2D] font-semibold">Your Context</h3>
          </div>

          <div className="space-y-3 text-sm">
            <ContextItem label="Active Projects" value="7" />
            <ContextItem label="Team Members" value="5" />
            <ContextItem label="Pending Tasks" value="12" />
            <ContextItem label="This Week Calls" value="8" />
          </div>

          <button className="w-full mt-4 px-4 py-2 rounded-lg border border-[#C8D8E6] text-[#0D1F2D] text-sm font-medium hover:bg-[#F8FAFC] transition-colors">
            View Full Context
          </button>
        </div>

        {/* Card 2: Recent Activity */}
        <div className="bg-white rounded-2xl border border-[#C8D8E6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#E0F7F2]">
              <Clock size={18} className="text-[#00D4A4]" />
            </div>
            <h3 className="text-[#0D1F2D] font-semibold">Recent Activity</h3>
          </div>

          <div className="space-y-3">
            <ActivityItem
              title="Called with Acme Team"
              time="2 hours ago"
              type="meeting"
            />
            <ActivityItem
              title="Project proposal sent"
              time="5 hours ago"
              type="email"
            />
            <ActivityItem
              title="Updated Website Redesign"
              time="Yesterday"
              type="task"
            />
          </div>

          <button className="w-full mt-4 px-4 py-2 rounded-lg border border-[#C8D8E6] text-[#0D1F2D] text-sm font-medium hover:bg-[#F8FAFC] transition-colors">
            View Timeline
          </button>
        </div>

        {/* Card 3: Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#C8D8E6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#E0F7F2]">
              <Zap size={18} className="text-[#00D4A4]" />
            </div>
            <h3 className="text-[#0D1F2D] font-semibold">Quick Actions</h3>
          </div>

          <div className="space-y-2">
            <QuickAction label="Schedule a meeting" />
            <QuickAction label="Send email to team" />
            <QuickAction label="Create new project" />
            <QuickAction label="Add task" />
          </div>

          <button className="w-full mt-4 px-4 py-2 rounded-lg bg-[#00D4A4] text-[#0D1F2D] text-sm font-medium hover:bg-[#00A882] transition-colors">
            Ask Flowtex
          </button>
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  icon: React.ReactNode;
  label: string;
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ icon, label, status }) => (
  <div className="bg-[#F8FAFC] rounded-lg p-3 border border-[#C8D8E6] flex flex-col items-center gap-2">
    <div className="text-[#2E4A62]">{icon}</div>
    <p className="text-[#0D1F2D] text-xs font-medium text-center">{label}</p>
    <p className="text-[#4A6880] text-xs">{status}</p>
  </div>
);

interface ContextItemProps {
  label: string;
  value: string;
}

const ContextItem: React.FC<ContextItemProps> = ({ label, value }) => (
  <div className="flex items-center justify-between pb-2 border-b border-[#E8EFF5] last:border-0">
    <span className="text-[#2E4A62]">{label}</span>
    <span className="text-[#0D1F2D] font-semibold">{value}</span>
  </div>
);

interface ActivityItemProps {
  title: string;
  time: string;
  type: "meeting" | "email" | "task";
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, time, type }) => {
  const icons = {
    meeting: <Calendar size={14} className="text-[#00D4A4]" />,
    email: <Mail size={14} className="text-[#3B82F6]" />,
    task: <CheckCircle2 size={14} className="text-[#22C55E]" />,
  };

  return (
    <div className="flex items-start gap-2 pb-2 border-b border-[#E8EFF5] last:border-0">
      <div className="mt-1">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[#0D1F2D] text-sm font-medium truncate">{title}</p>
        <p className="text-[#4A6880] text-xs">{time}</p>
      </div>
    </div>
  );
};

interface QuickActionProps {
  label: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ label }) => (
  <button className="w-full px-3 py-2.5 rounded-lg bg-[#E8EFF5] text-[#0D1F2D] text-sm font-medium hover:bg-[#DDE6EF] transition-colors flex items-center gap-2">
    <span className="text-[#00D4A4]">+</span>
    {label}
  </button>
);
