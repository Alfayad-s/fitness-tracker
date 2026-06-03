import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EditWorkoutView } from "@/components/workout/edit-workout-view";
import { getWorkoutDetail } from "@/lib/db/queries/workouts";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Edit workout",
};

export default async function EditWorkoutPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workout = await getWorkoutDetail(id, user.id);

  if (!workout) {
    notFound();
  }

  return <EditWorkoutView workout={workout} userId={user.id} />;
}
