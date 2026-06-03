"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import type { NavIconComponent } from "@/components/ui/modern-mobile-menu";

type NavMenuIconProps = {
  lineSrc: string;
  fillSrc: string;
  className?: string;
  active?: boolean;
};

export function NavMenuIcon({
  lineSrc,
  fillSrc,
  className,
  active = false,
}: NavMenuIconProps) {
  return (
    <Image
      src={active ? fillSrc : lineSrc}
      alt=""
      width={24}
      height={24}
      className={cn("icon pointer-events-none", className)}
      aria-hidden
    />
  );
}

export function createNavMenuIcon(
  lineSrc: string,
  fillSrc: string,
): NavIconComponent {
  function Icon({ className, active }: { className?: string; active?: boolean }) {
    return (
      <NavMenuIcon
        lineSrc={lineSrc}
        fillSrc={fillSrc}
        className={className}
        active={active}
      />
    );
  }

  return Icon;
}

export const NAV_MENU_ICONS = {
  home: createNavMenuIcon("/icons/home_7_line.svg", "/icons/home_7_fill.svg"),
  barbell: createNavMenuIcon("/icons/barbell_line.svg", "/icons/barbell_fill.svg"),
  chartBar: createNavMenuIcon(
    "/icons/chart_bar_line.svg",
    "/icons/chart_bar_fill.svg",
  ),
  user: createNavMenuIcon("/icons/user_3_line.svg", "/icons/user_3_fill.svg"),
} as const;
