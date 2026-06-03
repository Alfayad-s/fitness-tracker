import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { WorkoutDetailView } from "@/components/workout/workout-detail-view";
import { getWorkoutDetail } from "@/lib/db/queries/workouts";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Workout ${id.slice(0, 8)}` };
}

export default async function WorkoutDetailPage({ params }: PageProps) {
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

  return <WorkoutDetailView workout={workout} />;
}
