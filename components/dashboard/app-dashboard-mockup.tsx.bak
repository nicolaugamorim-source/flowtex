"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Calendar,
  Send,
  MoreVertical,
} from "lucide-react";

const FALLBACK_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Move fast and learn things.", author: "Paul Graham" },
  { text: "Escape competition through authenticity.", author: "Naval Ravikant" },
  { text: "Do things that don't scale.", author: "Paul Graham" },
  { text: "Make something people want.", author: "Paul Graham" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
];

const useQuoteOfDay = () => {
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const cached = localStorage.getItem("quote_of_day");
    const cachedDate = localStorage.getItem("quote_of_day_date");

    if (cached && cachedDate === today) {
      setQuote(JSON.parse(cached));
      return;
    }

    fetch("https://zenquotes.io/api/random")
      .then((res) => res.json())
      .then((data) => {
        if (data[0]) {
          const q = { text: data[0].q, author: data[0].a.replace(/,$/g, "") };
          setQuote(q);
          localStorage.setItem("quote_of_day", JSON.stringify(q));
          localStorage.setItem("quote_of_day_date", today);
        } else {
          throw new Error("Invalid response");
        }
      })
      .catch(() => {
        const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
        setQuote(fallback);
        localStorage.setItem("quote_of_day", JSON.stringify(fallback));
        localStorage.setItem("quote_of_day_date", today);
      });
  }, []);

  return quote;
};

export const AppDashboardMockup = () => {
  const quote = useQuoteOfDay();

  return (
    <div className="p-3 h-[380px] overflow-y-auto bg-[#F8FAFC] flex flex-col gap-4 rounded-2xl border border-[#C8D8E6] shadow-2xl">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-2 gap-4 h-auto items-center">
        {/* Good Morning Text */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-[#0D1F2D] text-2xl font-bold leading-tight text-center">
            Good morning,<br />Nicolau
          </p>
          {quote && (
            <p className="text-[#4A6880] text-xs italic font-light max-w-xs text-center mt-2">
              "{quote.text}" — {quote.author}
            </p>
          )}
        </div>

        {/* Card 4: Today & Tomorrow */}
        <div className="bg-[#E8EFF5] rounded-lg border border-[#C8D8E6] p-2 flex flex-col">
          <div className="flex flex-row gap-2">
            {/* Today Column */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-[#0D1F2D] text-xs font-semibold">Today</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">09:00 AM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[#0D1F2D] truncate text-xs">Team Standup</p>
                  </div>
                  <MoreVertical size={12} className="text-[#4A6880] flex-shrink-0" />
                </div>
                <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">02:30 PM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[#0D1F2D] truncate text-xs">Code Review</p>
                  </div>
                  <MoreVertical size={12} className="text-[#4A6880] flex-shrink-0" />
                </div>
              </div>
            </div>

            <div className="w-px bg-[#C8D8E6]"></div>

            {/* Tomorrow Column */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-[#0D1F2D] text-xs font-semibold">Tomorrow</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">10:00 AM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[#0D1F2D] truncate text-xs">Design Review</p>
                  </div>
                  <MoreVertical size={12} className="text-[#4A6880] flex-shrink-0" />
                </div>
                <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">11:30 AM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[#0D1F2D] truncate text-xs">Client Meeting</p>
                  </div>
                  <MoreVertical size={12} className="text-[#4A6880] flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1: Just happened */}
        <div className="bg-[#E8EFF5] rounded-lg border border-[#C8D8E6] p-3 flex flex-col gap-2">
          <h3 className="text-[#0D1F2D] text-xs font-semibold">Just happened</h3>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
            <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">02:32 PM</p>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-semibold text-[#0D1F2D] truncate flex-1 text-xs">Website Redesign</p>
                  <span className="text-xs bg-[#00D4A4] text-[#0D1F2D] font-medium px-1 py-0.5 rounded flex-shrink-0">Completed</span>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop" alt="JS" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            </div>
            <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">01:45 PM</p>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-semibold text-[#0D1F2D] truncate flex-1 text-xs">Design Review</p>
                  <span className="text-xs bg-[#00D4A4] text-[#0D1F2D] font-medium px-1 py-0.5 rounded flex-shrink-0">Completed</span>
                </div>
              </div>
              <div className="flex gap-0.5 items-center flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=24&h=24&fit=crop" alt="MD" className="w-4 h-4 rounded-full object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=24&h=24&fit=crop" alt="S" className="w-4 h-4 rounded-full object-cover -ml-1 border border-[#DDE6EF]" />
              </div>
            </div>
            <div className="bg-[#DDE6EF] p-2 rounded-sm border border-[#C8D8E6] text-xs h-10 flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-[#4A6880] font-medium whitespace-nowrap">12:15 PM</p>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-semibold text-[#0D1F2D] truncate flex-1 text-xs">API Integration</p>
                  <span className="text-xs bg-[#3B82F6] text-[#0D1F2D] font-medium px-1 py-0.5 rounded flex-shrink-0">Postponed</span>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=24&h=24&fit=crop" alt="S" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Card 2: Who's on what */}
        <div className="bg-[#E8EFF5] rounded-lg border border-[#C8D8E6] p-3 flex flex-col gap-2">
          <h3 className="text-[#0D1F2D] text-xs font-semibold">Who's on what</h3>
          <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
            <div className="bg-[#DDE6EF] rounded-sm border border-[#C8D8E6] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop" alt="John Smith" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#00D4A4] border border-[#DDE6EF]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[#0D1F2D]">John</p>
                <p className="text-xs text-[#4A6880]">API</p>
              </div>
            </div>
            <div className="bg-[#DDE6EF] rounded-sm border border-[#C8D8E6] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=24&h=24&fit=crop" alt="Sarah" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#00D4A4] border border-[#DDE6EF]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[#0D1F2D]">Sarah</p>
                <p className="text-xs text-[#4A6880]">Testing</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 my-1">
              <div className="flex-1 border-t border-[#C8D8E6]"></div>
              <p className="text-xs font-semibold text-[#4A6880] uppercase tracking-wide flex-shrink-0">Offline members</p>
              <div className="flex-1 border-t border-[#C8D8E6]"></div>
            </div>
            <div className="bg-[#DDE6EF] rounded-sm border border-[#C8D8E6] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=24&h=24&fit=crop" alt="Alex Chen" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#4A6880] border border-[#DDE6EF]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[#0D1F2D]">Alex</p>
                <p className="text-xs text-[#4A6880]">Offline</p>
              </div>
            </div>
            <div className="bg-[#DDE6EF] rounded-sm border border-[#C8D8E6] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop" alt="Emma Miller" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#4A6880] border border-[#DDE6EF]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[#0D1F2D]">Emma</p>
                <p className="text-xs text-[#4A6880]">Offline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Team chat */}
        <div className="bg-[#E8EFF5] rounded-lg border border-[#C8D8E6] p-3 flex flex-col">
          <h3 className="text-[#0D1F2D] text-xs font-semibold mb-2">Team chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            <div className="flex justify-end">
              <div className="flex flex-col items-end gap-1">
                <p className="text-xs text-[#4A6880] font-medium">You</p>
                <div className="bg-[#00D4A4] text-[#0D1F2D] px-2 py-1 rounded text-xs max-w-xs">
                  Hi team!
                </div>
              </div>
            </div>
            <div className="flex justify-start gap-1">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=20&h=20&fit=crop" alt="Sarah" className="w-4 h-4 rounded-full object-cover" />
                <p className="text-xs text-[#4A6880] font-medium">Sarah</p>
              </div>
              <div className="bg-white text-[#0D1F2D] p-1.5 rounded text-xs border border-[#C8D8E6]">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar size={12} className="text-blue-500" />
                  <p className="text-xs text-[#4A6880] font-medium">Calendar</p>
                </div>
                <p className="text-xs font-semibold">Team Meeting</p>
                <p className="text-xs text-[#4A6880]">10:30 - 11:30 AM</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Message..."
              className="flex-1 px-2 py-1.5 rounded text-xs border border-[#C8D8E6] bg-[#DDE6EF] text-[#0D1F2D] placeholder-[#4A6880] focus:outline-none focus:border-[#00D4A4]"
            />
            <button className="p-1 rounded text-[#0D1F2D] hover:bg-[#DDE6EF] transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
