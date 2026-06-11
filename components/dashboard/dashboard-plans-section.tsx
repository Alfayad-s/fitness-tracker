import { UpcomingWorkoutPlansCard } from "@/components/dashboard/upcoming-workout-plans-card";
import { TodaysWorkoutCard } from "@/components/workout/todays-workout-card";
import {
  fetchUpcomingWorkoutPlans,
  resolveDailyWorkoutPlanForDisplay,
} from "@/services/daily-plan-actions";

export async function DashboardPlansSection() {
  const [{ plan: dailyPlan }, schedule] = await Promise.all([
    resolveDailyWorkoutPlanForDisplay(),
    fetchUpcomingWorkoutPlans(7),
  ]);

  return (
    <>
      <TodaysWorkoutCard plan={dailyPlan} compact />
      <UpcomingWorkoutPlansCard plans={[...schedule.upcomingPlans]} />
    </>
  );
}
