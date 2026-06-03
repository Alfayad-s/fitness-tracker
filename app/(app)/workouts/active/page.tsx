import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActiveWorkoutView } from "@/components/workout/active-workout-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Active workout",
};

export default async function ActiveWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ActiveWorkoutView userId={user.id} />;
}
