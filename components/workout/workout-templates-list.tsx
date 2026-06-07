"use client";

import { Loader2, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  deleteWorkoutTemplateAction,
  toggleWorkoutTemplateFavoriteAction,
} from "@/services/workout-template-actions";
import type { WorkoutTemplateSummary } from "@/types/schemas/workout-template";

type WorkoutTemplatesListProps = {
  templates: WorkoutTemplateSummary[];
};

export function WorkoutTemplatesList({ templates }: WorkoutTemplatesListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFavorite = async (templateId: string, isFavorite: boolean) => {
    setBusyId(templateId);
    setError(null);
    const result = await toggleWorkoutTemplateFavoriteAction(
      templateId,
      !isFavorite,
    );
    setBusyId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handleDelete = async (templateId: string, name: string) => {
    if (!window.confirm(`Delete template "${name}"?`)) return;

    setBusyId(templateId);
    setError(null);
    const result = await deleteWorkoutTemplateAction(templateId);
    setBusyId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No templates yet. Save a completed workout or create one here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {templates.map((template) => (
        <article
          key={template.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/workouts/templates/${template.id}/edit`}
              className="font-semibold hover:underline"
            >
              {template.name}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template.exerciseCount} exercise
              {template.exerciseCount === 1 ? "" : "s"}
              {template.source !== "manual" ? ` · ${template.source}` : ""}
            </p>
            {template.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {template.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={template.isFavorite ? "Unfavorite" : "Favorite"}
              disabled={busyId === template.id}
              onClick={() =>
                handleFavorite(template.id, template.isFavorite)
              }
            >
              {busyId === template.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Star
                  className={`size-4 ${template.isFavorite ? "fill-amber-400 text-amber-500" : ""}`}
                />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete template"
              disabled={busyId === template.id}
              onClick={() => handleDelete(template.id, template.name)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
