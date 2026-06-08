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
  Send,
} from "lucide-react";

export const AppDashboard = () => {
  return (
    <div className="p-8 flex-1 overflow-y-auto bg-[#F8FAFC] flex flex-col gap-8">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-2 gap-8 h-1/2 items-center">
        {/* Good Morning Text - 1/2 width */}
        <div className="flex flex-col items-center justify-center h-full min-h-96">
          <p className="text-[#0D1F2D] text-6xl font-bold leading-tight text-center">
            Good morning,<br />Nicolau
          </p>
        </div>

        {/* Card 4: Today & Tomorrow */}
        <div className="bg-[#E8EFF5] rounded-2xl border border-[#C8D8E6] p-6 h-full flex flex-col">
          <div className="flex flex-row gap-6 h-full">
            {/* Today Column */}
            <div className="flex-1 flex flex-col gap-3">
              <h3 className="text-[#0D1F2D] text-xl font-semibold">Today</h3>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-[#C8D8E6]"></div>

            {/* Tomorrow Column */}
            <div className="flex-1 flex flex-col gap-3">
              <h3 className="text-[#0D1F2D] text-xl font-semibold">Tomorrow</h3>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
                <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-3 gap-8 h-1/2">
        {/* Card 1: Just happened */}
        <div className="bg-[#E8EFF5] rounded-2xl border border-[#C8D8E6] p-6 h-full flex flex-col gap-3">
          <h3 className="text-[#0D1F2D] text-xl font-semibold">Just happened</h3>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">14:32</p>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="font-semibold text-[#0D1F2D] truncate">Website Redesign</p>
                <span className="text-xs bg-[#00D4A4] text-[#0D1F2D] font-medium px-2 py-1 rounded-md w-fit">Completed</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                JS
              </div>
            </div>
            <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">13:45</p>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="font-semibold text-[#0D1F2D] truncate">Design Review</p>
                <span className="text-xs bg-[#3B82F6] text-[#0D1F2D] font-medium px-2 py-1 rounded-md w-fit">Updated</span>
              </div>
              <div className="flex gap-1 items-center flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  MD
                </div>
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold -ml-2 border-2 border-[#DDE6EF]">
                  S
                </div>
              </div>
            </div>
            <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">12:15</p>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="font-semibold text-[#0D1F2D] truncate">API Integration</p>
                <span className="text-xs bg-[#22C55E] text-[#0D1F2D] font-medium px-2 py-1 rounded-md w-fit">Added</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                S
              </div>
            </div>
            <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">11:20</p>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="font-semibold text-[#0D1F2D] truncate">Database Update</p>
                <span className="text-xs bg-[#00D4A4] text-[#0D1F2D] font-medium px-2 py-1 rounded-md w-fit">Completed</span>
              </div>
              <div className="flex gap-1 items-center flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  JS
                </div>
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold -ml-2 border-2 border-[#DDE6EF]">
                  MD
                </div>
              </div>
            </div>
            <div className="bg-[#DDE6EF] p-3 rounded-lg border border-[#C8D8E6] text-sm h-16 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">10:50</p>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <p className="font-semibold text-[#0D1F2D] truncate">Meeting Notes</p>
                <span className="text-xs bg-[#F59E0B] text-[#0D1F2D] font-medium px-2 py-1 rounded-md w-fit">Modified</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                MD
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Who's on what */}
        <div className="bg-[#E8EFF5] rounded-2xl border border-[#C8D8E6] p-6 h-full flex flex-col gap-4">
          <h3 className="text-[#0D1F2D] text-xl font-semibold">Who's on what</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#DDE6EF] rounded-lg border border-[#C8D8E6] p-3 flex items-center gap-3 h-16">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                JS
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-[#0D1F2D]">John Smith</p>
                <p className="text-xs text-[#4A6880]">Working on: API Design</p>
              </div>
            </div>
            <div className="bg-[#DDE6EF] rounded-lg border border-[#C8D8E6] p-3 flex items-center gap-3 h-16">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                MD
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-[#0D1F2D]">Mary Johnson</p>
                <p className="text-xs text-[#4A6880]">Working on: Offline</p>
              </div>
            </div>
            <div className="bg-[#DDE6EF] rounded-lg border border-[#C8D8E6] p-3 flex items-center gap-3 h-16">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                S
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-semibold text-[#0D1F2D]">Sarah</p>
                <p className="text-xs text-[#4A6880]">Working on: Testing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Talk with your team */}
        <div className="bg-[#E8EFF5] rounded-2xl border border-[#C8D8E6] p-6 h-full flex flex-col">
          <h3 className="text-[#0D1F2D] text-xl font-semibold mb-4">Talk with your team</h3>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            <div className="flex justify-end">
              <div className="flex flex-col items-end gap-1">
                <p className="text-xs text-[#4A6880] font-medium">You</p>
                <div className="bg-[#00D4A4] text-[#0D1F2D] px-3 py-2 rounded-lg text-sm max-w-xs">
                  Hi team, when is the meeting scheduled?
                </div>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="flex flex-col items-start gap-2 w-full">
                <p className="text-xs text-[#4A6880] font-medium">Sarah</p>
                <div className="bg-white text-[#0D1F2D] p-3 rounded-lg text-sm max-w-xs border border-[#C8D8E6] w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-blue-500" />
                    <p className="text-xs text-[#4A6880] font-medium">Google Calendar</p>
                  </div>
                  <div className="bg-[#E8EFF5] p-3 rounded border border-[#C8D8E6] mb-3">
                    <p className="font-semibold text-sm mb-1">Team Meeting</p>
                    <p className="text-xs text-[#2E4A62] mb-2">Thursday 10:30 - 11:30 AM</p>
                    <p className="text-xs text-[#4A6880]">Topic: Team Sync & Planning</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-2 py-1.5 text-xs rounded border border-[#C8D8E6] text-[#0D1F2D] hover:bg-[#F8FAFC] transition-colors">
                      View in Calendar
                    </button>
                    <button className="flex-1 px-2 py-1.5 text-xs rounded bg-[#00D4A4] text-[#0D1F2D] hover:bg-[#00A882] transition-colors font-medium">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-lg border border-[#C8D8E6] bg-[#DDE6EF] text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:border-[#00D4A4] focus:ring-1 focus:ring-[#00D4A4]"
            />
            <button className="p-2 rounded-lg text-[#0D1F2D] hover:bg-[#DDE6EF] hover:text-[#00D4A4] transition-colors">
              <Send size={20} />
            </button>
          </div>
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
  <div className="bg-[#DDE6EF] rounded-lg p-3 border border-[#C8D8E6] flex flex-col items-center gap-2">
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
