'use client';

import React from 'react';
import { AppDashboardMockup } from '@/components/dashboard/app-dashboard-mockup';
import { MoreVertical } from 'lucide-react';

export const AppMockupHero = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Laptop Frame */}
      <div className="w-full max-w-4xl">
        {/* Laptop Bezel */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-3xl p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-[var(--color-bg-base)] rounded-2xl overflow-hidden shadow-inner">
            {/* Browser/App Bar */}
            <div className="bg-white border-b border-[var(--color-bg-card)] px-6 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C940]"></div>
              </div>
              <div className="flex-1 bg-[#F0F4F8] rounded-lg px-4 py-2 text-xs text-[var(--color-text-disabled)] font-medium">
                app.flowtex.io/workspace
              </div>
              <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* App Content - Using Real Dashboard */}
            <div className="bg-[var(--color-bg-base)] p-6">
              <AppDashboardMockup />
            </div>
          </div>
        </div>

        {/* Laptop Stand */}
        <div className="flex justify-center gap-12 mt-4">
          <div className="w-24 h-3 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-b-xl"></div>
          <div className="w-24 h-3 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-b-xl"></div>
        </div>
      </div>
    </div>
  );
};
