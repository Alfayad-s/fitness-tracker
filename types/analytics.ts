export type WeeklyVolumePoint = {
  week: string;
  volumeKg: number;
  workoutCount: number;
};

export type WeeklyFrequencyPoint = {
  week: string;
  sessions: number;
};

export type WorkoutAnalyticsSummary = {
  totalWorkouts: number;
  totalVolumeKg: number;
  currentStreak: number;
  longestStreak: number;
  weeklyVolume: WeeklyVolumePoint[];
  weeklyFrequency: WeeklyFrequencyPoint[];
};

export type BodyTrendPoint = {
  date: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
};

export type BodyAnalyticsSummary = {
  points: BodyTrendPoint[];
};

/** Dashboard / progress body composition trends. */
export type BodyCompositionTrendPoint = {
  date: string;
  score: number | null;
  weightKg: number | null;
  bodyFatPercent: number | null;
  proteinKg: number | null;
  boneMassKg: number | null;
  bodyWaterKg: number | null;
  bodyWaterPercent: number | null;
  muscleMassKg: number | null;
};

export type ExerciseProgressPoint = {
  date: string;
  maxWeightKg: number;
  estimated1RmKg: number;
  bestSetVolume: number;
};

export type ExerciseOption = {
  id: string;
  name: string;
};

export type ExerciseProgressSummary = {
  exerciseId: string;
  exerciseName: string;
  points: ExerciseProgressPoint[];
};
