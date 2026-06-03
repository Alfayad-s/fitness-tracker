import { cn } from "@/lib/utils";

/** Shared active/inactive styles for sidebar and other link-based nav. */
export function getNavItemClassName(isActive: boolean): string {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

/** Accent used by InteractiveMenu (mobile bottom nav). */
export const NAV_ACCENT_COLOR = "var(--primary)";
