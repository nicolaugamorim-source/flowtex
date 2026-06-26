"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { saveTokenData } from "@/lib/google-token-manager";

export function AuthHandler() {
  const router = useRouter();
  const pathname = usePathname();
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
              .from("profiles")
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

          // Save Google access token from session (from OAuth provider)
          if (session.provider_token) {
            console.log("✅ Google provider_token found, saving with token manager");
            // Get refresh token if available (only on first auth)
            const refreshToken = session.provider_refresh_token || undefined;
            if (refreshToken) {
              console.log("✅ Refresh token also found from provider");
            }
            // Save with token manager (includes expiration tracking and DB storage)
            saveTokenData(session.provider_token, 3600, refreshToken);
            console.log("✅ Saved provider_token to localStorage and integrations table");
          } else {
            console.warn("⚠️ No provider_token in session. Check that OAuth is properly configured.");
            // Try to get from DB if it was saved previously
            try {
              const { data: integration } = await supabase
                .from("integrations")
                .select("access_token")
                .eq("user_id", user.id)
                .eq("provider", "google")
                .single();

              if (integration?.access_token) {
                console.log("✅ Found previously saved token in integrations table");
                localStorage.setItem("google_access_token", integration.access_token);
              }
            } catch (error) {
              console.log("ℹ️ No previously saved Google token in database");
            }
          }

          // Only redirect to the dashboard when we're on a pre-auth page (e.g. the
          // login page reloading mid-session) — never bounce the user away from
          // wherever they already are inside the app (e.g. /app/kanban) on reload.
          if (!pathname.startsWith("/app")) {
            console.log("✅ Auth handler complete, redirecting to /app");
            router.replace("/app");
          }
        }
      } catch (error) {
        console.error("❌ Auth error:", error);
      }
    };

    handleAuthFlow();
  }, [router, pathname]);

  return null;
}
