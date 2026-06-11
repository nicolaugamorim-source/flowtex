"use client";

import React, { createContext, useContext, useState } from "react";

interface CookieContextType {
  isCustomizeDialogOpen: boolean;
  openCustomizeDialog: () => void;
  closeCustomizeDialog: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: React.ReactNode }) {
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);

  const openCustomizeDialog = () => setIsCustomizeDialogOpen(true);
  const closeCustomizeDialog = () => setIsCustomizeDialogOpen(false);

  return (
    <CookieContext.Provider value={{ isCustomizeDialogOpen, openCustomizeDialog, closeCustomizeDialog }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieDialog() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error("useCookieDialog must be used within CookieProvider");
  }
  return context;
}
