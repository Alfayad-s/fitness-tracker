"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createCustomExerciseAction } from "@/services/exercise-actions";
import type { Exercise } from "@/types";
import {
  createCustomExerciseSchema,
  type CreateCustomExerciseInput,
} from "@/types/schemas/exercise";

const MUSCLE_OPTIONS = [
  "chest",
  "back",
  "shoulders",
  "legs",
  "arms",
  "core",
] as const;

const EQUIPMENT_OPTIONS = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "other",
] as const;

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
);

type CustomExerciseFormProps = {
  onCreated: (exercise: Exercise) => void;
  onCancel: () => void;
};

export function CustomExerciseForm({
  onCreated,
  onCancel,
}: CustomExerciseFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomExerciseInput>({
    defaultValues: {
      name: "",
      muscleGroup: "chest",
      equipment: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const parsed = createCustomExerciseSchema.safeParse(values);
    if (!parsed.success) return;

    const result = await createCustomExerciseAction(parsed.data);
    if ("error" in result) {
      setServerError(result.error);
      return;
    }

    onCreated(result.exercise);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="custom-exercise-name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="custom-exercise-name"
          placeholder="e.g. Cable crossover"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="custom-exercise-muscle" className="text-sm font-medium">
          Muscle group
        </label>
        <select
          id="custom-exercise-muscle"
          className={selectClassName}
          {...register("muscleGroup")}
        >
          {MUSCLE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        {errors.muscleGroup && (
          <p className="text-sm text-destructive">
            {errors.muscleGroup.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="custom-exercise-equipment"
          className="text-sm font-medium"
        >
          Equipment <span className="text-muted-foreground">(optional)</span>
        </label>
        <select
          id="custom-exercise-equipment"
          className={selectClassName}
          {...register("equipment")}
        >
          <option value="">—</option>
          {EQUIPMENT_OPTIONS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create & add"
          )}
        </Button>
      </div>
    </form>
  );
}
