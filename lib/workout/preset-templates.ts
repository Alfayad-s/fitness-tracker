import type { DailyPlanExercise } from "@/types/schemas/daily-plan";

export type PresetTemplateExercise = Pick<
  DailyPlanExercise,
  "exerciseName" | "muscleGroup" | "targetSets" | "targetReps" | "notes"
>;

export type PresetTemplateDefinition = {
  name: string;
  description: string;
  exercises: PresetTemplateExercise[];
};

function ex(
  exerciseName: string,
  targetSets: number,
  targetReps: number,
  muscleGroup?: DailyPlanExercise["muscleGroup"],
  notes?: string,
): PresetTemplateExercise {
  return { exerciseName, targetSets, targetReps, muscleGroup, notes };
}

function hold(
  exerciseName: string,
  targetSets: number,
  duration: string,
  muscleGroup: DailyPlanExercise["muscleGroup"] = "core",
): PresetTemplateExercise {
  return {
    exerciseName,
    targetSets,
    targetReps: 1,
    muscleGroup,
    notes: duration,
  };
}

export const PRESET_WORKOUT_TEMPLATES: PresetTemplateDefinition[] = [
  {
    name: "Push A",
    description:
      "Chest, shoulders, and triceps with core finisher (~90 min).",
    exercises: [
      ex("Barbell Bench Press", 4, 8, "chest"),
      ex("Incline Dumbbell Press", 4, 10, "chest"),
      ex("Seated Dumbbell Shoulder Press", 4, 8, "shoulders"),
      ex("Lateral Raise", 4, 12, "shoulders"),
      ex("Tricep Pushdown", 3, 10, "arms"),
      ex("Overhead Tricep Extension", 3, 12, "arms"),
      hold("Plank", 3, "30–60 sec hold"),
      ex("Russian Twist", 3, 15, "core", "each side"),
    ],
  },
  {
    name: "Pull A",
    description: "Back, biceps, and rear delts with core finisher (~90 min).",
    exercises: [
      ex("Lat Pulldown", 4, 8, "back"),
      ex("Seated Cable Row", 4, 8, "back"),
      ex("Single Arm Dumbbell Row", 4, 10, "back", "each side"),
      ex("Face Pull", 3, 12, "shoulders"),
      ex("Barbell Curl", 3, 10, "arms"),
      ex("Hammer Curl", 3, 12, "arms"),
      ex("Hanging Leg Raise", 3, 12, "core"),
    ],
  },
  {
    name: "Legs A",
    description: "Quad-focused leg day with core finisher (~90 min).",
    exercises: [
      ex("Barbell Squat", 4, 8, "legs"),
      ex("Romanian Deadlift", 4, 8, "legs"),
      ex("Leg Press", 4, 10, "legs"),
      ex("Bulgarian Split Squat", 3, 10, "legs", "each leg"),
      ex("Leg Extension", 3, 12, "legs"),
      ex("Standing Calf Raise", 4, 12, "legs"),
      hold("Plank", 3, "30–60 sec hold"),
    ],
  },
  {
    name: "Push B",
    description:
      "Alternate push focus — incline, flies, and triceps (~90 min).",
    exercises: [
      ex("Incline Barbell Bench Press", 4, 8, "chest"),
      ex("Dumbbell Fly", 4, 10, "chest"),
      ex("Arnold Press", 4, 8, "shoulders"),
      ex("Cable Lateral Raise", 4, 12, "shoulders"),
      ex("Tricep Dip", 3, 10, "arms"),
      ex("Tricep Kickback", 3, 12, "arms"),
      ex("Ab Wheel Rollout", 3, 10, "core", "from knees if needed"),
    ],
  },
  {
    name: "Pull B",
    description: "Deadlift-focused pull day with arm and core work (~90 min).",
    exercises: [
      ex("Deadlift", 4, 6, "back", "focus on form"),
      ex("Lat Pulldown", 4, 10, "back", "wide grip"),
      ex("T-Bar Row", 4, 8, "back"),
      ex("Single Arm Cable Row", 3, 10, "back", "each side"),
      ex("Rear Delt Fly", 4, 12, "shoulders"),
      ex("EZ Bar Curl", 3, 10, "arms", "superset with concentration curl"),
      ex("Concentration Curl", 3, 10, "arms", "superset with EZ bar curl"),
      ex("Russian Twist", 3, 15, "core", "each side"),
    ],
  },
  {
    name: "Legs B",
    description: "Hamstring and glute focus with core finisher (~90 min).",
    exercises: [
      ex("Romanian Deadlift", 4, 8, "legs"),
      ex("Front Squat", 4, 8, "legs"),
      ex("Seated Leg Curl", 4, 10, "legs"),
      ex("Walking Lunge", 3, 12, "legs", "steps each leg"),
      ex("Hip Thrust", 4, 10, "legs"),
      ex("Seated Calf Raise", 4, 12, "legs"),
      hold("Plank", 3, "30–60 sec hold"),
      hold("Side Plank", 3, "20–40 sec each side"),
    ],
  },
  {
    name: "Abs Workout",
    description: "Full core circuit — lower abs, upper abs, and obliques.",
    exercises: [
      ex("Hanging Leg Raise", 3, 12, "core"),
      ex("Cable Crunch", 3, 12, "core"),
      hold("Plank", 3, "30–60 sec hold"),
      ex("Russian Twist", 3, 15, "core", "each side"),
      ex("Bicycle Crunch", 3, 15, "core", "each side"),
      ex("Ab Wheel Rollout", 3, 10, "core", "from knees if needed"),
      ex("Reverse Crunch", 3, 12, "core"),
      hold("Mountain Climber", 3, "30–40 sec"),
      hold("Flutter Kick", 3, "20–30 sec"),
      hold("Side Plank", 3, "20–40 sec each side"),
    ],
  },
  {
    name: "Forearms Workout",
    description: "Grip and forearm strength — flexors, extensors, and carries.",
    exercises: [
      ex("Wrist Curl", 3, 12, "arms"),
      ex("Reverse Wrist Curl", 3, 12, "arms"),
      ex("Hammer Curl", 3, 10, "arms"),
      hold("Farmer's Walk", 3, "30–40 sec walk"),
      hold("Plate Pinch", 3, "20–30 sec hold"),
    ],
  },
];

export function getPresetTemplateDefinition(
  templateName: string,
): PresetTemplateDefinition | undefined {
  const key = templateName.trim().toLowerCase();
  return PRESET_WORKOUT_TEMPLATES.find(
    (template) => template.name.toLowerCase() === key,
  );
}

export function collectPresetTemplateNames(
  templateNames: Array<string | undefined>,
): string[] {
  return [
    ...new Set(
      templateNames.filter((name): name is string => Boolean(name?.trim())),
    ),
  ];
}
