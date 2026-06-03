import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DashboardQuickAction } from "@/types/dashboard";

type DashboardQuickActionsProps = {
  actions: DashboardQuickAction[];
};

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {actions.map((action) => (
        <Button
          key={action.href}
          asChild
          variant={action.variant === "primary" ? "default" : "outline"}
          className="min-h-11 flex-1 touch-manipulation"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ))}
    </div>
  );
}
