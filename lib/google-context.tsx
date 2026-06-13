"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

interface GoogleContextType {
  googleAccessToken: string | null;
  isLoading: boolean;
}

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getAccessToken = async () => {
      try {
        // First check for test token (dev only)
        const testToken = typeof window !== "undefined" ? localStorage.getItem("test_google_token") : null;
        if (testToken) {
          setGoogleAccessToken(testToken);
          console.log("✅ Test token loaded (DEV MODE)");
          return;
        }

        // Check localStorage for saved Google token
        const savedToken = typeof window !== "undefined" ? localStorage.getItem("google_access_token") : null;
        if (savedToken) {
          setGoogleAccessToken(savedToken);
          console.log("✅ Google token loaded from localStorage");
          setIsLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("Session provider_token:", session?.provider_token ? "EXISTS" : "MISSING");

        if (session?.provider_token) {
          setGoogleAccessToken(session.provider_token);
          console.log("✅ Google token set from session");
        } else {
          console.log("⚠️  No Google token available");
        }
      } catch (error) {
        console.error("Error getting Google access token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getAccessToken();

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session?.provider_token) {
        setGoogleAccessToken(session.provider_token);
      } else {
        // Check localStorage
        const savedToken = typeof window !== "undefined" ? localStorage.getItem("google_access_token") : null;
        if (savedToken) {
          setGoogleAccessToken(savedToken);
        } else {
          setGoogleAccessToken(null);
        }
      }
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  return (
    <GoogleContext.Provider value={{ googleAccessToken, isLoading }}>
      {children}
    </GoogleContext.Provider>
  );
}

export function useGoogle() {
  const context = useContext(GoogleContext);
  if (!context) {
    throw new Error("useGoogle must be used within GoogleProvider");
  }
  return context;
}
