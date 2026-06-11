import { DailyNutritionTargets } from "@/components/dashboard/daily-nutrition-targets";
import { CompositionFocusTips } from "@/components/dashboard/composition-focus-tips";
import type { UserProfile } from "@/lib/profile/get-user-profile";
import type { BodyMeasurement } from "@/types";
import type { User } from "@supabase/supabase-js";

type BodyCompositionSectionProps = {
  user: User;
  profile: UserProfile;
  latestMeasurement: BodyMeasurement | null;
};

export async function BodyCompositionSection({
  user,
  profile,
  latestMeasurement,
}: BodyCompositionSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <DailyNutritionTargets
        user={user}
        profile={profile}
        latestMeasurement={latestMeasurement}
      />

      <CompositionFocusTips
        goalType={profile.goalType}
        latestMeasurement={latestMeasurement}
      />
    </div>
  );
}
