"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BackButtonProps = {
  className?: string;
  /** Button label; defaults to "Go back". */
  label?: string;
  /** Optional fallback when history is empty (e.g. first visit). */
  fallbackHref?: string;
};

export function BackButton({
  className,
  label = "Go back",
  fallbackHref,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    if (fallbackHref) {
      router.push(fallbackHref);
      return;
    }
    router.back();
  };

  return (
    <Button
      type="button"
      variant="link"
      className={cn("h-auto gap-0 px-0 text-sm font-medium", className)}
      onClick={handleBack}
    >
      <ChevronLeft
        className="me-1 opacity-60"
        size={16}
        strokeWidth={2}
        aria-hidden="true"
      />
      {label}
    </Button>
  );
}
