"use client";

import { usePathname } from "next/navigation";

import { BackButton } from "@/components/ui/back-button";
import { shouldShowPageBackButton } from "@/lib/navigation/page-back-button";
import { cn } from "@/lib/utils";

type PageBackButtonProps = {
  className?: string;
  fallbackHref?: string;
};

export function PageBackButton({ className, fallbackHref }: PageBackButtonProps) {
  const pathname = usePathname();

  if (!shouldShowPageBackButton(pathname)) {
    return null;
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-lg shrink-0 px-4 pt-3 md:max-w-3xl",
        className,
      )}
    >
      <BackButton fallbackHref={fallbackHref} />
    </div>
  );
}
