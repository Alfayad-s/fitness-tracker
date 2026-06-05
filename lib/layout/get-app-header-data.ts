import { cache } from "react";

import { computeStreaks } from "@/lib/analytics/workout-stats";
import { fetchRecentWorkoutDatesForStreak } from "@/lib/db/queries/analytics";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { getRequestUser } from "@/lib/auth/require-user";

export type AppHeaderData = {
  avatarUrl: string | null;
  displayName: string | null;
  email: string | null;
  currentStreak: number;
};

const emptyHeaderData: AppHeaderData = {
  avatarUrl: null,
  displayName: null,
  email: null,
  currentStreak: 0,
};

export const getAppHeaderData = cache(async (): Promise<AppHeaderData> => {
  const user = await getRequestUser();

  if (!user) {
    return emptyHeaderData;
  }

  const [profile, workoutDates] = await Promise.all([
    getUserProfile(user),
    fetchRecentWorkoutDatesForStreak(user.id),
  ]);
  const { current: currentStreak } = computeStreaks(workoutDates);

  return {
    avatarUrl: profile.avatarUrl,
    displayName: profile.fullName,
    email: profile.email,
    currentStreak,
  };
});
