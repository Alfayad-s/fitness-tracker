"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MUSCLE_GROUPS } from "@/lib/exercises/default-exercises";
import {
  deleteCustomExerciseAction,
  fetchCustomExercises,
  updateCustomExerciseAction,
} from "@/services/exercise-actions";
import type { Exercise } from "@/types";
import type { CreateCustomExerciseInput } from "@/types/schemas/exercise";

const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS.filter((g) => g !== "all");

export function CustomExercisesList() {
  const router = useRouter();
  const [muscleGroup, setMuscleGroup] = useState("all");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CreateCustomExerciseInput>({
    name: "",
    muscleGroup: "chest",
    equipment: undefined,
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchCustomExercises(muscleGroup);
    setLoading(false);
    if ("error" in result && result.error) {
      setError(result.error);
      setExercises([]);
      return;
    }
    setExercises([...result.exercises]);
  }, [muscleGroup]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setEditForm({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup as CreateCustomExerciseInput["muscleGroup"],
      equipment: exercise.equipment ?? undefined,
    });
  };

  const handleUpdate = async (exerciseId: string) => {
    setBusyId(exerciseId);
    setError(null);
    const result = await updateCustomExerciseAction(exerciseId, editForm);
    setBusyId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    router.refresh();
    await load();
  };

  const handleDelete = async (exerciseId: string, name: string) => {
    if (!window.confirm(`Delete custom exercise "${name}"?`)) return;
    setBusyId(exerciseId);
    setError(null);
    const result = await deleteCustomExerciseAction(exerciseId);
    setBusyId(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    await load();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          My exercises
        </h2>
        <select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize"
        >
          <option value="all">All groups</option>
          {MUSCLE_GROUP_OPTIONS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : exercises.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom exercises yet. Create one when adding to a workout or via
          AI import.
        </p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="rounded-lg border border-border px-3 py-2"
            >
              {editingId === exercise.id ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <select
                    value={editForm.muscleGroup}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        muscleGroup: e.target
                          .value as CreateCustomExerciseInput["muscleGroup"],
                      }))
                    }
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm capitalize"
                  >
                    {MUSCLE_GROUP_OPTIONS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === exercise.id}
                      onClick={() => handleUpdate(exercise.id)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {exercise.muscleGroup}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${exercise.name}`}
                      onClick={() => startEdit(exercise)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${exercise.name}`}
                      disabled={busyId === exercise.id}
                      onClick={() => handleDelete(exercise.id, exercise.name)}
                    >
                      {busyId === exercise.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
