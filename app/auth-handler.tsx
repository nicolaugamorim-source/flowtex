"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createOrUpdateProfile, saveGoogleIntegration } from "@/lib/database";
import { saveTokenData } from "@/lib/google-token-manager";

export function AuthHandler() {
  const router = useRouter();
  const processedRef = useRef(false);

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

          // Create or update profile
          await createOrUpdateProfile(user.id, {
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            email: user.email,
            email_verified: user.email_confirmed_at ? true : false,
          });

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

              // Save Google integration
              await saveGoogleIntegration(user.id, {
                access_token: googleIdentity.identity_data.access_token,
                refresh_token: googleIdentity.identity_data.refresh_token,
                scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar",
              });

              console.log("✅ Google integration saved");
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
