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
    <div className="p-3 h-[380px] overflow-y-auto bg-[var(--color-bg-base)] flex flex-col gap-4">
      {/* Top Section - 2 Columns */}
      <div className="grid grid-cols-2 gap-4 h-auto items-center">
        {/* Good Morning Text */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-[var(--color-text-primary)] text-2xl font-bold leading-tight text-center">
            Good morning,<br />Nicolau
          </p>
          {quote && (
            <p className="text-[var(--color-text-muted)] text-xs italic font-light max-w-xs text-center mt-2">
              "{quote.text}" — {quote.author}
            </p>
          )}
        </div>

        {/* Card 4: Today & Tomorrow */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-2 flex flex-col">
          <div className="flex flex-row gap-2">
            {/* Today Column */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-[var(--color-text-primary)] text-xs font-semibold">Today</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">09:00 AM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate text-xs">Team Standup</p>
                  </div>
                  <MoreVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                </div>
                <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">02:30 PM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate text-xs">Code Review</p>
                  </div>
                  <MoreVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                </div>
              </div>
            </div>

            <div className="w-px bg-[var(--color-border-default)]"></div>

            {/* Tomorrow Column */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="text-[var(--color-text-primary)] text-xs font-semibold">Tomorrow</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">10:00 AM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate text-xs">Design Review</p>
                  </div>
                  <MoreVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                </div>
                <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
                  <div className="flex-shrink-0">
                    <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">11:30 AM</p>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate text-xs">Client Meeting</p>
                  </div>
                  <MoreVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Card 1: Just happened */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-3 flex flex-col gap-2">
          <h3 className="text-[var(--color-text-primary)] text-xs font-semibold">Just happened</h3>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
            <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">02:32 PM</p>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] truncate flex-1 text-xs">Website Redesign</p>
                  <span className="text-xs bg-[var(--color-accent)] text-[var(--color-text-primary)] font-medium px-1 py-0.5 rounded flex-shrink-0">Completed</span>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop" alt="JS" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            </div>
            <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">01:45 PM</p>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] truncate flex-1 text-xs">Design Review</p>
                  <span className="text-xs bg-[var(--color-accent)] text-[var(--color-text-primary)] font-medium px-1 py-0.5 rounded flex-shrink-0">Completed</span>
                </div>
              </div>
              <div className="flex gap-0.5 items-center flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=24&h=24&fit=crop" alt="MD" className="w-4 h-4 rounded-full object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=24&h=24&fit=crop" alt="S" className="w-4 h-4 rounded-full object-cover -ml-1 border border-[var(--color-bg-elevated)]" />
              </div>
            </div>
            <div className="bg-[var(--color-bg-elevated)] p-2 rounded-sm border border-[var(--color-border-default)] text-xs h-10 flex items-center justify-between gap-2">
              <div className="flex-shrink-0">
                <p className="text-xs text-[var(--color-text-muted)] font-medium whitespace-nowrap">12:15 PM</p>
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] truncate flex-1 text-xs">API Integration</p>
                  <span className="text-xs bg-[var(--color-info)] text-[var(--color-text-primary)] font-medium px-1 py-0.5 rounded flex-shrink-0">Postponed</span>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=24&h=24&fit=crop" alt="S" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Card 2: Who's on what */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-3 flex flex-col gap-2">
          <h3 className="text-[var(--color-text-primary)] text-xs font-semibold">Who's on what</h3>
          <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto">
            <div className="bg-[var(--color-bg-elevated)] rounded-sm border border-[var(--color-border-default)] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=24&h=24&fit=crop" alt="John Smith" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--color-accent)] border border-[var(--color-bg-elevated)]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">John</p>
                <p className="text-xs text-[var(--color-text-muted)]">API</p>
              </div>
            </div>
            <div className="bg-[var(--color-bg-elevated)] rounded-sm border border-[var(--color-border-default)] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=24&h=24&fit=crop" alt="Sarah" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--color-accent)] border border-[var(--color-bg-elevated)]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Sarah</p>
                <p className="text-xs text-[var(--color-text-muted)]">Testing</p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 my-1">
              <div className="flex-1 border-t border-[var(--color-border-default)]"></div>
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide flex-shrink-0">Offline members</p>
              <div className="flex-1 border-t border-[var(--color-border-default)]"></div>
            </div>
            <div className="bg-[var(--color-bg-elevated)] rounded-sm border border-[var(--color-border-default)] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=24&h=24&fit=crop" alt="Alex Chen" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--color-text-muted)] border border-[var(--color-bg-elevated)]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Alex</p>
                <p className="text-xs text-[var(--color-text-muted)]">Offline</p>
              </div>
            </div>
            <div className="bg-[var(--color-bg-elevated)] rounded-sm border border-[var(--color-border-default)] p-2 flex items-center gap-2 h-10">
              <div className="relative flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=24&h=24&fit=crop" alt="Emma Miller" className="w-5 h-5 rounded-full object-cover" />
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[var(--color-text-muted)] border border-[var(--color-bg-elevated)]"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Emma</p>
                <p className="text-xs text-[var(--color-text-muted)]">Offline</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Team chat */}
        <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-default)] p-3 flex flex-col">
          <h3 className="text-[var(--color-text-primary)] text-xs font-semibold mb-2">Team chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            <div className="flex justify-end">
              <div className="flex flex-col items-end gap-1">
                <p className="text-xs text-[var(--color-text-muted)] font-medium">You</p>
                <div className="bg-[var(--color-accent)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs max-w-xs">
                  Hi team!
                </div>
              </div>
            </div>
            <div className="flex justify-start gap-1">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=20&h=20&fit=crop" alt="Sarah" className="w-4 h-4 rounded-full object-cover" />
                <p className="text-xs text-[var(--color-text-muted)] font-medium">Sarah</p>
              </div>
              <div className="bg-white text-[var(--color-text-primary)] p-1.5 rounded text-xs border border-[var(--color-border-default)]">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar size={12} className="text-blue-500" />
                  <p className="text-xs text-[var(--color-text-muted)] font-medium">Calendar</p>
                </div>
                <p className="text-xs font-semibold">Team Meeting</p>
                <p className="text-xs text-[var(--color-text-muted)]">10:30 - 11:30 AM</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Message..."
              className="flex-1 px-2 py-1.5 rounded text-xs border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <button className="p-1 rounded text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
