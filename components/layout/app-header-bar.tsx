"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ExpandingAiDock } from "@/components/ui/expanding-ai-dock-shadcnui";
import { ExpandingSearchDock } from "@/components/ui/expanding-search-dock-shadcnui";
import { cn } from "@/lib/utils";

type AppHeaderBarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  /** Kept for API compatibility; streak renders in HeaderStreakPin */
  currentStreak?: number;
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function AppHeaderBar({
  avatarUrl,
  displayName,
  email,
}: AppHeaderBarProps) {
  const router = useRouter();
  const initials = getInitials(displayName, email);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  return (
    <header
      className="relative overflow-visible border-b border-border/60 bg-background/90 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-[4.75rem] max-w-lg items-center justify-between gap-4 px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
          <AnimatePresence initial={false}>
            {!isSearchExpanded && (
              <motion.div
                key="ai-dock"
                initial={false}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                  "shrink-0 overflow-hidden",
                  isAiExpanded ? "min-w-0 flex-1" : "w-auto",
                )}
              >
                <ExpandingAiDock
                  onExpandedChange={(expanded) => {
                    setIsAiExpanded(expanded);
                    if (expanded) setIsSearchExpanded(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {!isAiExpanded && (
              <motion.div
                key="search-dock"
                initial={false}
                animate={{ opacity: 1, flex: 1 }}
                exit={{ opacity: 0, width: 0, flex: "0 0 0px" }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <ExpandingSearchDock
                  placeholder="Search workouts, exercises…"
                  onExpandedChange={(expanded) => {
                    setIsSearchExpanded(expanded);
                    if (expanded) setIsAiExpanded(false);
                  }}
                  onSearch={(query) => {
                    router.push(
                      `/workouts?search=${encodeURIComponent(query)}`,
                    );
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          href="/profile"
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-90",
            "h-12 w-12",
          )}
          aria-label="Open profile"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName ?? "Profile"}
              width={48}
              height={48}
              className="h-12 w-12 object-cover"
              unoptimized
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center bg-muted text-base font-semibold text-muted-foreground"
              aria-hidden
            >
              {initials}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
