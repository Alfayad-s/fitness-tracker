"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MUSCLE_GROUPS } from "@/lib/exercises/default-exercises";
import { cn } from "@/lib/utils";
import { CustomExerciseForm } from "@/components/workout/custom-exercise-form";
import { useOptionalWorkoutEditor } from "@/components/workout/workout-editor-context";
import { fetchExercises } from "@/services/workout-actions";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import type { Exercise } from "@/types";

type ExercisePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PickerTab = "search" | "create";

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export function ExercisePicker({ open, onOpenChange }: ExercisePickerProps) {
  const editor = useOptionalWorkoutEditor();
  const addExerciseStore = useWorkoutSessionStore((s) => s.addExercise);
  const sessionExercisesStore = useWorkoutSessionStore((s) => s.session?.exercises);

  const addExercise = editor?.addExercise ?? addExerciseStore;
  const sessionExercises = editor?.exercises ?? sessionExercisesStore;

  const [tab, setTab] = useState<PickerTab>("search");
  const [query, setQuery] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("all");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchExercises(query, muscleGroup);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setExercises([]);
      return;
    }
    setExercises(result.exercises);
  }, [query, muscleGroup]);

  useEffect(() => {
    if (!open) {
      setTab("search");
      return;
    }
    const id = window.setTimeout(load, 200);
    return () => window.clearTimeout(id);
  }, [open, load]);

  const addedIds = new Set(sessionExercises?.map((e) => e.exerciseId) ?? []);

  const handleAdd = (exercise: Exercise) => {
    addExercise({
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
    });
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-background shadow-xl outline-none">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              Add exercise
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="flex gap-2 border-b border-border px-4 pt-3">
            {(["search", "create"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t === "search" ? "Search" : "Create custom"}
              </button>
            ))}
          </div>

          {tab === "create" ? (
            <div className={cn("overflow-y-auto px-4 py-4", hideScrollbar)}>
              <CustomExerciseForm
                onCreated={(exercise) => {
                  handleAdd(exercise);
                }}
                onCancel={() => setTab("search")}
              />
            </div>
          ) : (
            <>
              <div className="space-y-3 border-b border-border px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search exercises…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div
                  className={cn(
                    "flex gap-2 overflow-x-auto pb-1",
                    hideScrollbar,
                  )}
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setMuscleGroup(group)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                        muscleGroup === group
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/50 text-foreground",
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <ul
                className={cn(
                  "flex-1 overflow-y-auto px-2 py-2",
                  hideScrollbar,
                )}
              >
            {loading && (
              <li className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </li>
            )}
            {error && !loading && (
              <li className="px-2 py-4 text-center text-sm text-destructive">
                {error}
              </li>
            )}
            {!loading && !error && exercises.length === 0 && (
              <li className="px-2 py-8 text-center text-sm text-muted-foreground">
                No exercises found.
              </li>
            )}
            {!loading &&
              exercises.map((exercise) => {
                const added = addedIds.has(exercise.id);
                return (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => handleAdd(exercise)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                        added
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-muted",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{exercise.name}</p>
                        <p className="text-xs capitalize text-muted-foreground">
                          {exercise.muscleGroup}
                          {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                        </p>
                      </div>
                      {added ? (
                        <span className="text-xs text-muted-foreground">Added</span>
                      ) : (
                        <Plus className="size-4 shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                );
              })}
              </ul>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
