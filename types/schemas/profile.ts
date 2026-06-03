import { z } from "zod";

export const genderValues = [
  "male",
  "female",
  "non_binary",
  "prefer_not_to_say",
] as const;

export const goalTypeValues = [
  "lose_weight",
  "gain_muscle",
  "maintain",
  "strength",
  "endurance",
  "general_fitness",
] as const;

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.literal("")])
    .transform((v) => (v === "" ? null : v));

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z
        .string()
        .min(2, "Username must be at least 2 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores")
        .nullable(),
    ),
  fullName: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.string().max(100, "Name is too long").nullable()),
  gender: emptyToNull(z.enum(genderValues)).pipe(
    z.enum(genderValues).nullable(),
  ),
  heightCm: z
    .union([z.string(), z.number()])
    .transform((v) => {
      if (v === "" || v === undefined) return null;
      const n = typeof v === "number" ? v : Number.parseFloat(String(v));
      return Number.isNaN(n) ? null : n;
    })
    .pipe(
      z
        .number()
        .min(50, "Enter a height between 50 and 300 cm")
        .max(300, "Enter a height between 50 and 300 cm")
        .nullable(),
    ),
  goalType: emptyToNull(z.enum(goalTypeValues)).pipe(
    z.enum(goalTypeValues).nullable(),
  ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Raw form values before Zod transforms (react-hook-form). */
export type ProfileFormValues = {
  username: string;
  fullName: string;
  gender: string;
  heightCm: string | number;
  goalType: string;
};
