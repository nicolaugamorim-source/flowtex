"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { upsertProfileFromGoogle } from "@/lib/auth";
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

          // Try to save Google access token from session
          if (session.provider_token) {
            // Save with token manager (includes expiration tracking)
            saveTokenData(session.provider_token, 3600); // Assume 1 hour expiry
            console.log("✅ Saved provider_token with token manager");
          }

          // Get user and extract refresh token from identities
          const { data: { user } } = await supabase.auth.getUser();

          console.log("👤 User identities:", JSON.stringify(user?.identities, null, 2));

          if (user?.identities) {
            const googleIdentity = user.identities.find((id: any) => id.provider === "google");

            console.log("🔍 Google identity data:", JSON.stringify(googleIdentity?.identity_data, null, 2));

            if (googleIdentity?.identity_data?.access_token) {
              localStorage.setItem("google_access_token", googleIdentity.identity_data.access_token);
              console.log("✅ Saved access_token from identities to localStorage");
            }

            // Save refresh token if available
            if (googleIdentity?.identity_data?.refresh_token) {
              console.log("✅ Refresh token found, saving to database...");

              const { error: updateError } = await supabase
                .from("users")
                .update({
                  google_refresh_token: googleIdentity.identity_data.refresh_token,
                })
                .eq("id", user.id);

              if (updateError) {
                console.error("❌ Error saving refresh token:", updateError);
              } else {
                console.log("✅ Refresh token saved to database");
              }
            } else {
              console.warn("⚠️ No refresh token in identity_data. This usually means the user already authorized this app before. Google only returns the refresh token on first authorization.");
            }
          }

          console.log("✅ Upserting user...");
          await upsertProfileFromGoogle();
          console.log("✅ User upserted, redirecting to /app");
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
