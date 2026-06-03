"use server";

import { loadDashboardOverview } from "@/lib/dashboard/get-dashboard-data";
import { createClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "@/types/dashboard";

export type DashboardDataResult = {
  data: DashboardSummary;
  dbUnavailable: boolean;
};

/** Server action wrapper — prefer `loadDashboardOverview` in Server Components. */
export async function fetchDashboardData(): Promise<
  DashboardDataResult | { error: string; data: null; dbUnavailable: boolean }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: "You must be signed in.",
      data: null,
      dbUnavailable: false,
    };
  }

  const { summary, dbUnavailable } = await loadDashboardOverview(user);

  return {
    dbUnavailable,
    data: summary,
  };
}
