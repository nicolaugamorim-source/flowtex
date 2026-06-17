"use client";

import { Calendar, Clock, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface Member {
  name: string;
  avatar?: string;
  email?: string;
}

interface CalendarEventBubbleProps {
  title: string;
  date: string;
  time: string;
  dayOfWeek?: string;
  calendar?: string;
  members?: Member[];
  action: "created" | "updated" | "deleted" | "view";
  actionText?: string;
}

function formatTitle(title: string): string {
  // List of prepositions and small words to skip
  const skipWords = ['de', 'do', 'da', 'dos', 'das', 'para', 'por', 'em', 'com', 'e', 'ou', 'que', 'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as'];

  // Split by spaces and filter out skip words
  const words = title
    .split(/\s+/)
    .map((word) => word.toLowerCase())
    .filter((word) => !skipWords.includes(word))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  // Join with hyphen
  if (words.length > 1) {
    return words.join(" - ");
  }
  return words[0] || title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
}

export function CalendarEventBubble({
  title,
  date,
  time,
  dayOfWeek,
  calendar,
  members = [],
  action,
  actionText: customActionText,
}: CalendarEventBubbleProps) {
  const defaultActionTexts = {
    created: "Scheduled",
    updated: "Updated",
    deleted: "Removed",
    view: "Upcoming",
  };

  const actionText = customActionText || defaultActionTexts[action as keyof typeof defaultActionTexts];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg p-4 w-full max-w-sm bg-[#F8FAFC] text-[#0D1F2D]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold leading-tight mb-1 text-[#0D1F2D]">
            {title}
          </h3>
          {calendar && (
            <p className="text-xs text-[#4A6880] font-medium">{calendar}</p>
          )}
        </div>
        <div className="px-2 py-1 rounded-lg text-xs font-semibold text-[#0D1F2D]">
          {actionText}
        </div>
      </div>

      {/* Date and Time */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-[#0D1F2D]">
          <Calendar className="w-4 h-4 text-[#4A6880]" />
          <span>
            {dayOfWeek && `${dayOfWeek}, `}
            {date}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#0D1F2D]">
          <Clock className="w-4 h-4 text-[#4A6880]" />
          <span>{time}</span>
        </div>
      </div>

      {/* Members */}
      {members.length > 0 && (
        <div className="border-t border-[#E2EAF1] pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#4A6880]" />
            <span className="text-sm font-medium text-[#0D1F2D]">
              {members.length} {members.length === 1 ? "participante" : "participantes"}
            </span>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member, idx) => (
              <Avatar key={idx} className="h-8 w-8 border-2 border-[#F8FAFC]">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-[#E2EAF1] text-[#0D1F2D] text-xs font-bold">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 5 && (
              <div className="h-8 w-8 rounded-full bg-[#E2EAF1] border-2 border-[#F8FAFC] flex items-center justify-center text-xs font-bold text-[#0D1F2D]">
                +{members.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
