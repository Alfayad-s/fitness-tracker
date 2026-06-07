import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { WorkoutTemplateEditor } from "@/components/workout/workout-template-editor";
import { fetchWorkoutTemplate } from "@/services/workout-template-actions";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchWorkoutTemplate(id);
  return {
    title: result.template?.name ?? "Edit template",
  };
}

export default async function EditWorkoutTemplatePage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const { template, error } = await fetchWorkoutTemplate(id);

  if (error || !template) notFound();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <Link
          href="/workouts/templates"
          className="text-sm text-muted-foreground underline"
        >
          ← Templates
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit template
        </h1>
      </header>

      <WorkoutTemplateEditor template={template} />
    </main>
  );
}
