"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AI_PAGE_WITH_INTRO } from "@/lib/ai/navigation";
import { cn } from "@/lib/utils";

const AI_HINT_STORAGE_KEY = "fitness-tracker-ai-hint-seen";

type ExpandingAiDockProps = {
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
};

function hasSeenAiHint(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(AI_HINT_STORAGE_KEY) === "1";
}

export function ExpandingAiDock({
  onExpandedChange,
  className,
}: ExpandingAiDockProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
    onExpandedChange?.(expanded);
  };

  const markHintSeen = () => {
    localStorage.setItem(AI_HINT_STORAGE_KEY, "1");
  };

  const goToAi = () => {
    router.push(AI_PAGE_WITH_INTRO);
  };

  const handleIconClick = () => {
    if (!hasSeenAiHint()) {
      setExpanded(true);
      return;
    }
    goToAi();
  };

  const handleCollapse = () => {
    setExpanded(false);
    markHintSeen();
  };

  const openAi = () => {
    markHintSeen();
    setExpanded(false);
    onExpandedChange?.(false);
    goToAi();
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {!isExpanded ? (
          <motion.button
            key="ai-icon"
            type="button"
            aria-label="Open AI assistant"
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handleIconClick}
            className="flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card p-0 transition-opacity hover:opacity-90"
          >
            <img
              src="/gif/ai.gif"
              alt=""
              width={48}
              height={48}
              decoding="async"
              className="pointer-events-none block h-full w-full object-cover"
            />
          </motion.button>
        ) : (
          <motion.div
            key="ai-expanded"
            initial={false}
            animate={{ width: "min(15.5rem, 100%)", opacity: 1 }}
            exit={{ width: 48, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="relative max-w-full"
          >
            <div className="relative flex h-12 items-center gap-2 overflow-hidden rounded-full border border-border bg-card/90 pr-1 pl-1.5 backdrop-blur-md">
              <button
                type="button"
                onClick={openAi}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  <img
                    src="/gif/ai.gif"
                    alt=""
                    width={36}
                    height={36}
                    className="block h-full w-full object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-semibold">
                    AI Assistant
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Create workout plans
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Close AI assistant hint"
                onClick={handleCollapse}
                className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
