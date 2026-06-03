"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayDateString } from "@/lib/workout/format";
import {
  getWorkoutSessionStatus,
  isWorkoutSessionInProgress,
} from "@/types/workout-session";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import {
  startWorkoutFormSchema,
  type StartWorkoutFormValues,
} from "@/types/schemas/workout";

type StartWorkoutFormProps = {
  userId: string;
};

export function StartWorkoutForm({ userId }: StartWorkoutFormProps) {
  const router = useRouter();
  const session = useWorkoutSessionStore((s) => s.session);
  const startWorkout = useWorkoutSessionStore((s) => s.startWorkout);
  const discardWorkout = useWorkoutSessionStore((s) => s.discardWorkout);

  const inProgress =
    session && isWorkoutSessionInProgress(getWorkoutSessionStatus(session));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StartWorkoutFormValues>({
    defaultValues: {
      title: "Workout",
      date: todayDateString(),
      notes: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const parsed = startWorkoutFormSchema.safeParse(values);
    if (!parsed.success) return;

    if (inProgress) {
      const replace = window.confirm(
        "You already have a workout in progress. Starting a new one will discard it.",
      );
      if (!replace) return;
      discardWorkout();
    }

    startWorkout({
      userId,
      title: parsed.data.title,
      date: parsed.data.date,
      notes: parsed.data.notes,
    });

    router.push("/workouts/active");
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          {...register("title", { required: true })}
          placeholder="Push day"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="date" className="text-sm font-medium">
          Date
        </label>
        <Input id="date" type="date" {...register("date")} />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          placeholder="Focus, energy, etc."
          {...register("notes")}
        />
      </div>

      <Button type="submit" className="h-12 w-full text-base">
        Start workout
      </Button>
    </form>
  );
}
