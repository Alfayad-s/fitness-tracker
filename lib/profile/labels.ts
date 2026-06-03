import type { goalTypeValues, genderValues } from "@/types/schemas/profile";

export const GENDER_OPTIONS: {
  value: (typeof genderValues)[number];
  label: string;
}[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const GOAL_OPTIONS: {
  value: (typeof goalTypeValues)[number];
  label: string;
}[] = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "gain_muscle", label: "Gain muscle" },
  { value: "maintain", label: "Maintain" },
  { value: "strength", label: "Build strength" },
  { value: "endurance", label: "Improve endurance" },
  { value: "general_fitness", label: "General fitness" },
];
