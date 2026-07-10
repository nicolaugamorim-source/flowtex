"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Mail,
  MessageSquare,
  SquareKanban,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export const SIDEBAR_ONBOARDING_EVENT = "flowtex:onboarding-sidebar";
export const SIDEBAR_HOVER_EVENT = "flowtex:sidebar-hover";

type SidebarOnboardingOverride = { forceOpen: boolean; disableHover: boolean } | null;

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

interface SessionNavBarProps {
  teamName?: string;
  avatarUrl?: string;
  userName?: string;
  userEmail?: string;
}

export function SessionNavBar({
  teamName = "Flowtex",
  avatarUrl,
  userName = "User",
  userEmail = "user@flowtex.xyz",
}: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [onboardingOverride, setOnboardingOverride] = useState<SidebarOnboardingOverride>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SidebarOnboardingOverride>).detail;
      setOnboardingOverride(detail ?? null);
    };
    window.addEventListener(SIDEBAR_ONBOARDING_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_ONBOARDING_EVENT, handler);
  }, []);

  const collapsed = onboardingOverride?.forceOpen ? false : isCollapsed;
  const hoverDisabled = onboardingOverride?.disableHover ?? false;

  // Let the rest of the page know to blur itself while the sidebar is expanded.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SIDEBAR_HOVER_EVENT, { detail: !collapsed }));
  }, [collapsed]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <motion.div
      data-onboarding="sidebar-nav"
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r border-[var(--color-border-default)] fixed"
      )}
      initial={collapsed ? "closed" : "open"}
      animate={collapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps as any}
      onMouseEnter={() => !hoverDisabled && setIsCollapsed(false)}
      onMouseLeave={() => !hoverDisabled && setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-[var(--color-text-muted)] h-full shrink-0 flex-col bg-[var(--color-bg-base)] border-[var(--color-border-default)] transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b border-[var(--color-border-subtle)] p-[var(--space-2)]">
              <div className="mt-[1.5px] flex w-full">
                <div className="flex h-8 w-full flex-row items-center justify-start px-[var(--space-2)] text-[var(--color-text-primary)]">
                  <div className="h-5 w-5 shrink-0 overflow-hidden">
                    <Image
                      src="/logo.svg"
                      alt="Flowtex"
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain scale-150"
                      style={{ width: 20, height: 20 }}
                    />
                  </div>
                  <motion.li variants={variants}>
                    {!collapsed && (
                      <p className="ml-[var(--space-2)] text-[length:var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                        {teamName}
                      </p>
                    )}
                  </motion.li>
                </div>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-[var(--space-4)]">
                <ScrollArea className="h-16 grow p-[var(--space-2)]">
                  <div className={cn("flex w-full flex-col gap-[var(--space-1)]")}>
                    <Link
                      href="/app"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname === "/app" &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!collapsed && (
                          <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Dashboard</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                      href="/app/inbox"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname?.includes("/inbox") &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!collapsed && (
                          <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Inbox</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                      href="/app/kanban"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname?.includes("/kanban") &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <SquareKanban className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!collapsed && (
                          <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Kanban</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                      href="/app/clients"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname?.includes("/clients") &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!collapsed && (
                          <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Clients</p>
                        )}
                      </motion.li>
                    </Link>

                    <Separator className="w-full bg-[var(--color-border-subtle)]" />

                    {!collapsed && (
                      <Link
                        href="/app/feedback"
                        className="flex h-auto w-full flex-col items-center justify-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-primary)] font-medium text-[length:var(--text-sm)] border border-[var(--color-border-default)]"
                      >
                        <motion.div variants={variants}>
                          <div className="text-center leading-tight">
                            <p>Share</p>
                            <p>Feedback</p>
                          </div>
                        </motion.div>
                      </Link>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-[var(--space-2)] border-t border-[var(--color-border-subtle)] gap-[var(--space-2)]">
                <Link
                  href="/app/integrations"
                  className="flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-muted)]"
                >
                  <Zap className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!collapsed && (
                      <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Integrations</p>
                    )}
                  </motion.li>
                </Link>
                <Link
                  href="/app/chat-history"
                  className="flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-muted)]"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!collapsed && (
                      <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Chat History</p>
                    )}
                  </motion.li>
                </Link>
                <Link
                  href="/settings"
                  className="flex h-8 w-full flex-row items-center rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-muted)]"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!collapsed && (
                      <p className="ml-[var(--space-2)] text-[length:var(--text-sm)] font-medium">Settings</p>
                    )}
                  </motion.li>
                </Link>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-[var(--space-2)] rounded-[var(--radius-md)] px-[var(--space-2)] py-[var(--space-2)] transition hover-accent-50 text-[var(--color-text-muted)]">
                        <Avatar className="size-6 bg-[var(--color-accent)]">
                          <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                          <AvatarFallback className="bg-[var(--color-accent)] text-white font-bold text-[length:var(--text-xs)]">
                            {userName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-[var(--space-2)]"
                        >
                          {!collapsed && (
                            <p className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-primary)]">{userName}</p>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5} className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
                      <div className="flex flex-row items-center gap-[var(--space-2)] p-[var(--space-2)]">
                        <Avatar className="size-8 bg-[var(--color-accent)]">
                          <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                          <AvatarFallback className="bg-[var(--color-accent)] text-white font-bold">
                            {userName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-[length:var(--text-sm)] font-medium text-[var(--color-text-primary)]">
                            {userName}
                          </span>
                          <span className="line-clamp-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                            {userEmail}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-[var(--color-text-primary)] cursor-pointer">
                        <LogOut className="h-4 w-4 mr-[var(--space-2)]" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
