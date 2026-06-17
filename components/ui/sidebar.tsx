"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
  Plus,
  Mail,
  SquareKanban,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  userEmail = "user@flowtex.com",
}: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

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
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r border-[var(--color-border-default)] fixed"
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps as any}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-[var(--color-text-muted)] h-full shrink-0 flex-col bg-[var(--color-bg-base)] border-[var(--color-border-default)] transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b border-[var(--color-border-subtle)] p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2 text-[var(--color-text-primary)] hover-accent-50"
                    >
                      <Image
                        src="/logo.svg"
                        alt="Flowtex"
                        width={24}
                        height={24}
                        className="shrink-0"
                      />
                      <motion.li
                        variants={variants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                          <p className="text-lg font-bold text-[var(--color-text-primary)]">
                            {teamName}
                          </p>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="text-[var(--color-text-primary)]">
                        <Plus className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    <Link
                      href="/app"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname === "/app" &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Dashboard</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                      href="/app/inbox"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname?.includes("/inbox") &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <Mail className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Inbox</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                      href="/app/kanban"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname?.includes("/kanban") &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <SquareKanban className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Kanban</p>
                        )}
                      </motion.li>
                    </Link>

                    <Link
                      href="/app/clients"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-primary)]",
                        pathname?.includes("/clients") &&
                          "bg-[var(--color-accent)]/40",
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Clients</p>
                        )}
                      </motion.li>
                    </Link>

                    <Separator className="w-full bg-[var(--color-border-subtle)]" />
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col p-2 border-t border-[var(--color-border-subtle)] gap-2">
                <Link
                  href="/app/integrations"
                  className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-muted)]"
                >
                  <Zap className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium">Integrations</p>
                    )}
                  </motion.li>
                </Link>
                <Link
                  href="/settings"
                  className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-muted)]"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium">Settings</p>
                    )}
                  </motion.li>
                </Link>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover-accent-50 text-[var(--color-text-muted)]">
                        <Avatar className="size-6 bg-[var(--color-accent)]">
                          <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                          <AvatarFallback className="bg-[var(--color-accent)] text-white font-bold text-xs">
                            {userName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{userName}</p>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5} className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg">
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-8 bg-[var(--color-accent)]">
                          <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                          <AvatarFallback className="bg-[var(--color-accent)] text-white font-bold">
                            {userName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {userName}
                          </span>
                          <span className="line-clamp-1 text-xs text-[var(--color-text-muted)]">
                            {userEmail}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings/profile" className="text-[var(--color-text-primary)]">
                          <UserCircle className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="text-[var(--color-text-primary)] cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
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
