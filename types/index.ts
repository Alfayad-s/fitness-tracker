import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type {
  bodyMeasurements,
  exercises,
  sets,
  users,
  workoutExercises,
  workouts,
} from "@/lib/db/schema";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Exercise = InferSelectModel<typeof exercises>;
export type NewExercise = InferInsertModel<typeof exercises>;

export type Workout = InferSelectModel<typeof workouts>;
export type NewWorkout = InferInsertModel<typeof workouts>;

export type WorkoutExercise = InferSelectModel<typeof workoutExercises>;
export type NewWorkoutExercise = InferInsertModel<typeof workoutExercises>;

export type Set = InferSelectModel<typeof sets>;
export type NewSet = InferInsertModel<typeof sets>;

export type BodyMeasurement = InferSelectModel<typeof bodyMeasurements>;
export type NewBodyMeasurement = InferInsertModel<typeof bodyMeasurements>;

export type {
  BodyMeasurementMap,
} from "@/lib/db/schema";

export type Gender = User["gender"];
export type Feeling = Workout["feeling"];
export type GoalType = User["goalType"];
