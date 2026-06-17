"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { saveTokenData } from "@/lib/google-token-manager";

export function AuthHandler() {
  const router = useRouter();
  const processedRef = useRef(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleAuthFlow = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        console.log("🔐 Auth session check:", session ? "HAS_SESSION" : "NO_SESSION");

        if (session) {
          console.log("✅ Session found");

          // Get user data
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            console.error("❌ No user found");
            return;
          }

          // Profile was already created in the OAuth callback
          console.log("✅ User authenticated:", user.id);

          // Load user's theme preference
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("theme")
              .eq("id", user.id)
              .single();

            if (profile?.theme) {
              setTheme(profile.theme);
              console.log("✅ Loaded theme preference:", profile.theme);
            }
          } catch (error) {
            console.warn("⚠️ Failed to load theme preference:", error);
          }

          // Try to save Google access token from session
          if (session.provider_token) {
            // Save with token manager (includes expiration tracking)
            saveTokenData(session.provider_token, 3600); // Assume 1 hour expiry
            console.log("✅ Saved provider_token with token manager");
          }

          // Extract Google OAuth data from identities
          if (user?.identities) {
            const googleIdentity = user.identities.find((id: any) => id.provider === "google");

            console.log("🔍 Google identity data:", JSON.stringify(googleIdentity?.identity_data, null, 2));

            if (googleIdentity?.identity_data?.access_token) {
              localStorage.setItem("google_access_token", googleIdentity.identity_data.access_token);
              console.log("✅ Saved access_token from identities to localStorage");
            } else {
              console.warn("⚠️ No access_token in identity_data");
            }

            if (googleIdentity?.identity_data?.refresh_token) {
              console.log("✅ Refresh token found, saving to integrations table");
            } else {
              console.warn("⚠️ No refresh token in identity_data. This usually means the user already authorized this app before. Google only returns the refresh token on first authorization.");
            }
          }

          console.log("✅ Auth handler complete, redirecting to /app");
          router.replace("/app");
        }
      } catch (error) {
        console.error("❌ Auth error:", error);
      }
    };

    handleAuthFlow();
  }, [router]);

  return null;
}
