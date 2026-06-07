"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import {
  WorkoutEditorProvider,
  useWorkoutEditor,
} from "@/components/workout/workout-editor-context";
import { updateWorkoutTemplateAction } from "@/services/workout-template-actions";
import type { WorkoutTemplateDetail } from "@/types/schemas/workout-template";
import type { SaveWorkoutSessionInput } from "@/types/schemas/workout";
import type { SessionExercise } from "@/types/workout-session";

type WorkoutTemplateEditorProps = {
  template: WorkoutTemplateDetail;
};

function templateToSessionExercises(
  template: WorkoutTemplateDetail,
): SessionExercise[] {
  return template.exercises
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((item) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      name: item.exercise.name,
      category: item.exercise.category,
      muscleGroup: item.exercise.muscleGroup,
      equipment: item.exercise.equipment,
      orderIndex: item.orderIndex,
      sets: Array.from(
        { length: Math.max(item.targetSets ?? 1, 1) },
        () => ({
          id: crypto.randomUUID(),
          reps: item.targetReps,
          weightKg: item.targetWeightKg,
          rpe: null,
          restSeconds: 90,
          isWarmup: false,
          completedAt: null,
        }),
      ),
    }));
}

function TemplateEditorForm({ template }: { template: WorkoutTemplateDetail }) {
  const router = useRouter();
  const { exercises, removeExercise } = useWorkoutEditor();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (exercises.length === 0) {
      setError("Add at least one exercise.");
      setSaving(false);
      return;
    }

    const result = await updateWorkoutTemplateAction(template.id, {
      name,
      description: description.trim() || null,
      exercises: exercises.map((ex, index) => {
        const firstSet = ex.sets[0];
        return {
          exerciseId: ex.exerciseId,
          orderIndex: index,
          targetSets: ex.sets.length,
          targetReps: firstSet?.reps ?? null,
          targetWeightKg: firstSet?.weightKg ?? null,
          notes: null,
        };
      }),
    });

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="template-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="template-desc" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="template-desc"
          rows={2}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Exercises</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        {exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exercises yet.</p>
        ) : (
          <ul className="space-y-2">
            {exercises.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{ex.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {ex.sets.length} sets
                    {ex.sets[0]?.reps ? ` · ${ex.sets[0].reps} reps target` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${ex.name}`}
                  onClick={() => removeExercise(ex.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="h-12 w-full"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save template"
        )}
      </Button>

      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}

export function WorkoutTemplateEditor({ template }: WorkoutTemplateEditorProps) {
  const baseSession: SaveWorkoutSessionInput = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    title: template.name,
    date: new Date().toISOString().slice(0, 10),
    notes: null,
    feeling: null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    totalPausedMs: 0,
    exercises: templateToSessionExercises(template),
  };

  return (
    <WorkoutEditorProvider initial={baseSession}>
      <TemplateEditorForm template={template} />
    </WorkoutEditorProvider>
  );
}
