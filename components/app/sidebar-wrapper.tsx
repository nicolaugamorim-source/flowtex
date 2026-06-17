"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessionNavBar } from "@/components/ui/sidebar";

export function SidebarWrapper() {
  const [teamName, setTeamName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("teamName") || "Flowtex";
    }
    return "Flowtex";
  });
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userName") || "User";
    }
    return "User";
  });
  const [userEmail, setUserEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userEmail") || "user@flowtex.com";
    }
    return "user@flowtex.com";
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          console.log("👤 User metadata:", user.user_metadata);

          const email = user.email || "user@flowtex.com";
          setUserEmail(email);
          localStorage.setItem("userEmail", email);

          // Get avatar from Google metadata
          const googleAvatar = user.user_metadata?.avatar_url;
          console.log("🖼️ Avatar URL:", googleAvatar);
          setAvatarUrl(googleAvatar);

          // Get user profile
          const { data: profile } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", user.id)
            .single();

          // Get business profile
          const { data: businessProfile } = await supabase
            .from("profiles")
            .select("business_name")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            setUserName(profile.full_name || user.email?.split("@")[0] || "User");
            localStorage.setItem("userName", profile.full_name || user.email?.split("@")[0] || "User");
          } else {
            // Fallback to user metadata from Google
            const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
            setUserName(fullName);
            localStorage.setItem("userName", fullName);
          }

          if (businessProfile?.business_name) {
            setTeamName(businessProfile.business_name);
            localStorage.setItem("teamName", businessProfile.business_name);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

  return (
    <SessionNavBar
      teamName={teamName}
      avatarUrl={avatarUrl}
      userName={userName}
      userEmail={userEmail}
    />
  );
}
