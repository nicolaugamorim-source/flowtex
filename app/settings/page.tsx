"use client";

// Account settings page — theme, profile info, and subscription management.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { SidebarWrapper } from "@/components/app/sidebar-wrapper";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";

const LANGUAGES = [
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

// User-facing settings page (language, theme, account info).
export default function SettingsPage() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);
        setUserEmail(user.email || "");
        setAvatarUrl(user.user_metadata?.avatar_url);

        // Fetch user data
        const { data: userData } = await supabase
          .from("users")
          .select("language, full_name")
          .eq("id", user.id)
          .single();

        if (userData?.language) {
          setLanguage(userData.language);
        }
        if (userData?.full_name) {
          setUserName(userData.full_name);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleSaveLanguage = async (newLanguage: string) => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ language: newLanguage })
        .eq("id", userId);

      if (error) throw error;

      setLanguage(newLanguage);
      console.log("Language saved:", newLanguage);
    } catch (error) {
      console.error("Error saving language:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-bg-base)]">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[var(--color-accent)] font-semibold"
        >
          Loading settings...
        </motion.div>
      </div>
    );
  }

  const avatarInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-[var(--color-bg-base)]">
      <SidebarWrapper />

      <main className="flex-1 overflow-auto">
        <section className="relative min-h-screen w-full px-4 py-10">
          {/* Gradient Background */}
          <div
            aria-hidden
            className="absolute inset-0 isolate -z-10 opacity-30 contain-strict"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(0,212,164,0.12)_0,rgba(0,165,130,0.06)_50%,transparent_80%)] absolute top-0 left-0 h-96 w-96 -translate-y-40 -rotate-45 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,212,164,0.08)_0,transparent_80%)] absolute top-0 right-0 h-64 w-64 -translate-y-20 rounded-full"
            />
          </div>

          <div className="mx-auto w-full max-w-4xl space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col"
            >
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Settings</h2>
              <p className="text-[var(--color-text-muted)] text-base">
                Manage your account and preferences.
              </p>
            </motion.div>

            {/* Separator */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.1 }}
              className="h-px bg-gradient-to-r from-[var(--color-border-subtle)] via-[var(--color-border-subtle)] to-transparent origin-left"
            />

            {/* Settings Sections */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="py-4 space-y-8"
            >
              {/* Profile Section */}
              <div className="animate-in fade-in grid grid-cols-1 gap-x-10 gap-y-4 py-8 duration-500 md:grid-cols-10">
                <div className="w-full space-y-1.5 md:col-span-4">
                  <h3 className="text-lg leading-none font-semibold text-[var(--color-text-primary)]">
                    Your Profile
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm">
                    View your account information and profile.
                  </p>
                </div>

                <div className="md:col-span-6">
                  <div className="flex items-center gap-6 bg-[var(--color-bg-card)] rounded-lg p-6 border border-[var(--color-border-subtle)]">
                    <Avatar className="h-16 w-16 border-2 border-[var(--color-accent-subtle)]">
                      <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-white text-lg font-bold">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {userName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{userEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[var(--color-border-subtle)]" />

              {/* Appearance Section */}
              <div className="animate-in fade-in grid grid-cols-1 gap-x-10 gap-y-4 py-8 duration-500 md:grid-cols-10">
                <div className="w-full space-y-1.5 md:col-span-4">
                  <h3 className="text-lg leading-none font-semibold text-[var(--color-text-primary)]">
                    Appearance
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Switch between light and dark mode
                  </p>
                </div>

                <div className="md:col-span-6">
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-default)' }}>
                    <p style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Dark Mode</p>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="h-px bg-[var(--color-border-subtle)]" />

              {/* Billing Section */}
              <div className="animate-in fade-in grid grid-cols-1 gap-x-10 gap-y-4 py-8 duration-500 md:grid-cols-10">
                <div className="w-full space-y-1.5 md:col-span-4">
                  <h3 className="text-lg leading-none font-semibold text-[var(--color-text-primary)]">
                    Billing
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Manage your subscription, payment method, and invoices
                  </p>
                </div>

                <div className="md:col-span-6">
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-default)' }}>
                    <p style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Subscription</p>
                    <a
                      href="/api/stripe/portal"
                      className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text-primary)' }}
                    >
                      Manage billing
                    </a>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
