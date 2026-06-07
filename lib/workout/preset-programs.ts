export type PresetProgramDay = {
  dayOfWeek: number;
  label: string;
  isRestDay: boolean;
  templateName?: string;
};

export type PresetProgramDefinition = {
  id: string;
  name: string;
  description: string;
  days: PresetProgramDay[];
};

export const PRESET_PROGRAMS: PresetProgramDefinition[] = [
  {
    id: "ppl-growth",
    name: "PPL Growth Split (Mon–Sat)",
    description:
      "Push–Pull–Legs twice weekly with Sunday rest. ~90 min sessions with core finishers.",
    days: [
      {
        dayOfWeek: 1,
        label: "Push A",
        isRestDay: false,
        templateName: "Push A",
      },
      {
        dayOfWeek: 2,
        label: "Pull A",
        isRestDay: false,
        templateName: "Pull A",
      },
      {
        dayOfWeek: 3,
        label: "Legs A",
        isRestDay: false,
        templateName: "Legs A",
      },
      {
        dayOfWeek: 4,
        label: "Push B",
        isRestDay: false,
        templateName: "Push B",
      },
      {
        dayOfWeek: 5,
        label: "Pull B",
        isRestDay: false,
        templateName: "Pull B",
      },
      {
        dayOfWeek: 6,
        label: "Legs B",
        isRestDay: false,
        templateName: "Legs B",
      },
      {
        dayOfWeek: 0,
        label: "Rest / Active Recovery",
        isRestDay: true,
      },
    ],
  },
  {
    id: "ppl",
    name: "Push / Pull / Legs (Simple)",
    description: "Classic 6-day PPL split with one rest day.",
    days: [
      { dayOfWeek: 1, label: "Push", isRestDay: false, templateName: "Push day" },
      { dayOfWeek: 2, label: "Pull", isRestDay: false, templateName: "Pull day" },
      { dayOfWeek: 3, label: "Legs", isRestDay: false, templateName: "Legs day" },
      { dayOfWeek: 4, label: "Push", isRestDay: false, templateName: "Push day" },
      { dayOfWeek: 5, label: "Pull", isRestDay: false, templateName: "Pull day" },
      { dayOfWeek: 6, label: "Legs", isRestDay: false, templateName: "Legs day" },
      { dayOfWeek: 0, label: "Rest", isRestDay: true },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    description: "4 training days with alternating upper and lower.",
    days: [
      { dayOfWeek: 1, label: "Upper", isRestDay: false, templateName: "Upper body" },
      { dayOfWeek: 2, label: "Lower", isRestDay: false, templateName: "Lower body" },
      { dayOfWeek: 3, label: "Rest", isRestDay: true },
      { dayOfWeek: 4, label: "Upper", isRestDay: false, templateName: "Upper body" },
      { dayOfWeek: 5, label: "Lower", isRestDay: false, templateName: "Lower body" },
      { dayOfWeek: 6, label: "Rest", isRestDay: true },
      { dayOfWeek: 0, label: "Rest", isRestDay: true },
    ],
  },
  {
    id: "full-body-3",
    name: "Full Body ×3",
    description: "Three full-body sessions per week.",
    days: [
      { dayOfWeek: 1, label: "Full body A", isRestDay: false, templateName: "Full body" },
      { dayOfWeek: 2, label: "Rest", isRestDay: true },
      { dayOfWeek: 3, label: "Full body B", isRestDay: false, templateName: "Full body" },
      { dayOfWeek: 4, label: "Rest", isRestDay: true },
      { dayOfWeek: 5, label: "Full body C", isRestDay: false, templateName: "Full body" },
      { dayOfWeek: 6, label: "Rest", isRestDay: true },
      { dayOfWeek: 0, label: "Rest", isRestDay: true },
    ],
  },
];
