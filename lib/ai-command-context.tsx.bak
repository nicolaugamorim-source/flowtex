"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface AICommandContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AICommandContext = createContext<AICommandContextType | undefined>(undefined);

export function AICommandProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AICommandContext.Provider value={{ isOpen, open, close }}>
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
