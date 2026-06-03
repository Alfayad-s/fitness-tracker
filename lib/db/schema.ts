import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
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

import { auditTimestamps } from "@/lib/db/audit-columns";

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

export const mealTypeEnum = pgEnum("meal_type", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
]);

/** Profile row; `id` matches `auth.users.id` after sync (see lib/auth/sync-user.ts). */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    username: text("username").unique(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    gender: genderEnum("gender"),
    heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
    goalType: goalTypeEnum("goal_type"),
    ...auditTimestamps,
  },
  (table) => [index("users_email_idx").on(table.email)],
);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    muscleGroup: text("muscle_group").notNull(),
    equipment: text("equipment"),
    isCustom: boolean("is_custom").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...auditTimestamps,
  },
  (table) => [
    index("exercises_muscle_group_idx").on(table.muscleGroup),
    index("exercises_created_by_idx").on(table.createdBy),
    index("exercises_is_custom_idx").on(table.isCustom),
  ],
);

export const workouts = pgTable(
  "workouts",
  {
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
    ...auditTimestamps,
  },
  (table) => [
    index("workouts_user_id_idx").on(table.userId),
    index("workouts_date_idx").on(table.date),
    index("workouts_user_id_date_idx").on(table.userId, table.date),
  ],
);

export const workoutExercises = pgTable(
  "workout_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    index("workout_exercises_workout_id_idx").on(table.workoutId),
    index("workout_exercises_exercise_id_idx").on(table.exerciseId),
  ],
);

export const sets = pgTable(
  "sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutExerciseId: uuid("workout_exercise_id")
      .notNull()
      .references(() => workoutExercises.id, { onDelete: "cascade" }),
    reps: smallint("reps"),
    weightKg: numeric("weight_kg", { precision: 7, scale: 2 }),
    rpe: smallint("rpe"),
    restSeconds: integer("rest_seconds"),
    isWarmup: boolean("is_warmup").notNull().default(false),
  },
  (table) => [
    index("sets_workout_exercise_id_idx").on(table.workoutExerciseId),
  ],
);

export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    bodyFatPercent: numeric("body_fat_percent", { precision: 5, scale: 2 }),
    bodyWaterKg: numeric("body_water_kg", { precision: 6, scale: 2 }),
    proteinKg: numeric("protein_kg", { precision: 6, scale: 2 }),
    mineralKg: numeric("mineral_kg", { precision: 6, scale: 2 }),
    muscleMassKg: numeric("muscle_mass_kg", { precision: 6, scale: 2 }),
    boneMassKg: numeric("bone_mass_kg", { precision: 6, scale: 2 }),
    bmi: numeric("bmi", { precision: 5, scale: 2 }),
    visceralFatLevel: smallint("visceral_fat_level"),
    metabolicAge: numeric("metabolic_age", { precision: 5, scale: 1 }),
    skeletalMuscleMassKg: numeric("skeletal_muscle_mass_kg", {
      precision: 6,
      scale: 2,
    }),
    bodyWaterPercent: numeric("body_water_percent", { precision: 5, scale: 2 }),
    measurements: jsonb("measurements").$type<BodyMeasurementMap>(),
    ...auditTimestamps,
  },
  (table) => [
    index("body_measurements_user_id_idx").on(table.userId),
    index("body_measurements_user_id_recorded_at_idx").on(
      table.userId,
      table.recordedAt,
    ),
  ],
);

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

export const mealEntries = pgTable(
  "meal_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    mealType: mealTypeEnum("meal_type").notNull().default("other"),
    name: text("name").notNull(),
    calories: integer("calories"),
    proteinG: numeric("protein_g", { precision: 6, scale: 2 }),
    carbsG: numeric("carbs_g", { precision: 6, scale: 2 }),
    fatG: numeric("fat_g", { precision: 6, scale: 2 }),
    notes: text("notes"),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...auditTimestamps,
  },
  (table) => [
    index("meal_entries_user_id_log_date_idx").on(table.userId, table.logDate),
  ],
);

export const waterEntries = pgTable(
  "water_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date").notNull(),
    amountMl: integer("amount_ml").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...auditTimestamps,
  },
  (table) => [
    index("water_entries_user_id_log_date_idx").on(table.userId, table.logDate),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  exercises: many(exercises),
  bodyMeasurements: many(bodyMeasurements),
  mealEntries: many(mealEntries),
  waterEntries: many(waterEntries),
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

export const mealEntriesRelations = relations(mealEntries, ({ one }) => ({
  user: one(users, {
    fields: [mealEntries.userId],
    references: [users.id],
  }),
}));

export const waterEntriesRelations = relations(waterEntries, ({ one }) => ({
  user: one(users, {
    fields: [waterEntries.userId],
    references: [users.id],
  }),
}));
