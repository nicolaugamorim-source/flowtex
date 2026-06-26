"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Message } from "@/lib/use-chat-bot";

interface AICommandContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  seedMessages: Message[] | null;
  openWithMessages: (messages: Message[]) => void;
  consumeSeedMessages: () => void;
}

const AICommandContext = createContext<AICommandContextType | undefined>(undefined);

export function AICommandProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [seedMessages, setSeedMessages] = useState<Message[] | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const openWithMessages = useCallback((messages: Message[]) => {
    setSeedMessages(messages);
    setIsOpen(true);
  }, []);

  const consumeSeedMessages = useCallback(() => setSeedMessages(null), []);

  return (
    <AICommandContext.Provider
      value={{ isOpen, open, close, seedMessages, openWithMessages, consumeSeedMessages }}
    >
      {children}
    </AICommandContext.Provider>
  );
}

export function useAICommand() {
  const context = useContext(AICommandContext);
  if (!context) {
    throw new Error("useAICommand must be used within AICommandProvider");
  }
  return context;
}
