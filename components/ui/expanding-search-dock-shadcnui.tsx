"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ExpandingSearchDockProps = {
  onSearch?: (query: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  placeholder?: string;
  className?: string;
};

export function ExpandingSearchDock({
  onSearch,
  onExpandedChange,
  placeholder = "Search...",
  className,
}: ExpandingSearchDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const handleExpand = () => {
    setIsExpanded(true);
    onExpandedChange?.(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery("");
    onExpandedChange?.(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="icon"
            type="button"
            aria-label="Open search"
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={handleExpand}
            className="flex h-12 w-12 min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
          >
            <Search className="h-6 w-6" />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={false}
            animate={{ width: "min(20rem, 100%)", opacity: 1 }}
            exit={{ width: 48, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onSubmit={handleSubmit}
            className="relative w-full max-w-full"
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(12px)" }}
              className="relative flex items-center gap-2 overflow-hidden rounded-full border border-border bg-card/80 backdrop-blur-md"
            >
              <div className="ml-4 shrink-0">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
                aria-label="Search"
                className="h-12 min-w-0 flex-1 bg-transparent pr-2 text-base outline-none placeholder:text-muted-foreground"
              />
              <motion.button
                type="button"
                aria-label="Close search"
                onClick={handleCollapse}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
