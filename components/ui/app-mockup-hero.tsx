import React from 'react';
import { Mail, Calendar, Zap, MessageSquare, Database, Users, Plug } from 'lucide-react';

export const AppMockupHero = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Laptop Frame */}
      <div className="w-full max-w-3xl">
        {/* Laptop Bezel */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-3xl p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-[#F8FAFC] rounded-2xl overflow-hidden shadow-inner">
            {/* Browser Bar */}
            <div className="bg-white border-b border-[#E8EFF5] px-6 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28C940]"></div>
              </div>
              <div className="flex-1 bg-[#F0F4F8] rounded-lg px-4 py-2 text-xs text-[#7A96AA]">
                flowtex.app
              </div>
            </div>

            {/* App Content */}
            <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F0F4F8] p-8 min-h-[500px]">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#0D1F2D] mb-2">Your Workspace</h1>
                <p className="text-[#7A96AA]">Where every conversation is remembered</p>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Chat Card */}
                <div className="bg-white rounded-xl border border-[#C8D8E6] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00D4A4]/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#00D4A4]" />
                    </div>
                    <h3 className="font-semibold text-[#0D1F2D]">Team Chat</h3>
                  </div>
                  <p className="text-sm text-[#7A96AA]">Real-time collaboration</p>
                </div>

                {/* Integrations Card */}
                <div className="bg-white rounded-xl border border-[#C8D8E6] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00D4A4]/10 flex items-center justify-center">
                      <Plug className="w-5 h-5 text-[#00D4A4]" />
                    </div>
                    <h3 className="font-semibold text-[#0D1F2D]">10+ Apps</h3>
                  </div>
                  <p className="text-sm text-[#7A96AA]">Connect your tools</p>
                </div>

                {/* Calendar Card */}
                <div className="bg-white rounded-xl border border-[#C8D8E6] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00D4A4]/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#00D4A4]" />
                    </div>
                    <h3 className="font-semibold text-[#0D1F2D]">Calendar</h3>
                  </div>
                  <p className="text-sm text-[#7A96AA]">Sync schedules</p>
                </div>

                {/* Analytics Card */}
                <div className="bg-white rounded-xl border border-[#C8D8E6] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00D4A4]/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-[#00D4A4]" />
                    </div>
                    <h3 className="font-semibold text-[#0D1F2D]">AI Context</h3>
                  </div>
                  <p className="text-sm text-[#7A96AA]">Smart assistance</p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="flex gap-3">
                <button className="flex-1 bg-[#00D4A4] text-[#0D1F2D] py-2 rounded-lg font-semibold hover:bg-[#00A882] transition-colors text-sm">
                  Start Free Trial
                </button>
                <button className="flex-1 border border-[#C8D8E6] text-[#2E4A62] py-2 rounded-lg font-semibold hover:bg-white transition-colors text-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Stand */}
        <div className="flex justify-center gap-12 mt-4">
          <div className="w-20 h-3 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-b-xl"></div>
          <div className="w-20 h-3 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-b-xl"></div>
        </div>
      </div>
    </div>
  );
};
