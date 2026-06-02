import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "non_binary",
  "prefer_not_to_say",
]);

export const feelingEnum = pgEnum("feeling", [
  "terrible",
  "bad",
  "okay",
  "good",
  "great",
]);

export const goalTypeEnum = pgEnum("goal_type", [
  "lose_weight",
  "gain_muscle",
  "maintain",
  "strength",
  "endurance",
  "general_fitness",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  gender: genderEnum("gender"),
  heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
  goalType: goalTypeEnum("goal_type"),
});

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment"),
  isCustom: boolean("is_custom").notNull().default(false),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
});

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: date("date").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  feeling: feelingEnum("feeling"),
  duration: integer("duration"),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }),
  orderIndex: integer("order_index").notNull(),
});

export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutExerciseId: uuid("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  reps: smallint("reps"),
  weightKg: numeric("weight_kg", { precision: 7, scale: 2 }),
  rpe: smallint("rpe"),
  restSeconds: integer("rest_seconds"),
  isWarmup: boolean("is_warmup").notNull().default(false),
});

export const bodyMeasurements = pgTable("body_measurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  bodyFatPercent: numeric("body_fat_percent", { precision: 5, scale: 2 }),
  measurements: jsonb("measurements").$type<BodyMeasurementMap>(),
});

export type BodyMeasurementMap = {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
  neckCm?: number;
  shouldersCm?: number;
  [key: string]: number | undefined;
};

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  exercises: many(exercises),
  bodyMeasurements: many(bodyMeasurements),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  creator: one(users, {
    fields: [exercises.createdBy],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  }),
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const bodyMeasurementsRelations = relations(
  bodyMeasurements,
  ({ one }) => ({
    user: one(users, {
      fields: [bodyMeasurements.userId],
      references: [users.id],
    }),
  }),
);
