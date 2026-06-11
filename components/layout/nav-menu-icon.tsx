"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import type { NavIconComponent } from "@/components/ui/modern-mobile-menu";

type NavMenuIconProps = {
  lineSrc: string;
  fillSrc: string;
  className?: string;
  active?: boolean;
  accentColor?: string;
};

export function NavMenuIcon({
  lineSrc,
  fillSrc,
  className,
  active = false,
  accentColor,
}: NavMenuIconProps) {
  if (active) {
    if (accentColor) {
      return (
        <span
          className={cn("icon pointer-events-none block size-6", className)}
          style={{
            backgroundColor: accentColor,
            WebkitMaskImage: `url(${fillSrc})`,
            maskImage: `url(${fillSrc})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
          aria-hidden
        />
      );
    }

    return (
      <Image
        src={fillSrc}
        alt=""
        width={24}
        height={24}
        className={cn("icon pointer-events-none", className)}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={lineSrc}
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
  function Icon({
    className,
    active,
    accentColor,
  }: {
    className?: string;
    active?: boolean;
    accentColor?: string;
  }) {
    return (
      <NavMenuIcon
        lineSrc={lineSrc}
        fillSrc={fillSrc}
        className={className}
        active={active}
        accentColor={accentColor}
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
