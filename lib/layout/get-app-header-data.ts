import { computeStreaks } from "@/lib/analytics/workout-stats";
import { fetchAllWorkoutDates } from "@/lib/db/queries/analytics";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { createClient } from "@/lib/supabase/server";

export type AppHeaderData = {
  avatarUrl: string | null;
  displayName: string | null;
  email: string | null;
  currentStreak: number;
};

export async function getAppHeaderData(): Promise<AppHeaderData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      avatarUrl: null,
      displayName: null,
      email: null,
      currentStreak: 0,
    };
  }

  const [profile, workoutDates] = await Promise.all([
    getUserProfile(user),
    fetchAllWorkoutDates(user.id),
  ]);
  const { current: currentStreak } = computeStreaks([...new Set(workoutDates)]);

  return {
    avatarUrl: profile.avatarUrl,
    displayName: profile.fullName,
    email: profile.email,
    currentStreak,
  };
}
