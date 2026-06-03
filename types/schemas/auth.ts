import { z } from "zod";

export const loginEmailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

export type LoginEmailValues = z.infer<typeof loginEmailSchema>;

export const loginOtpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d{6}$/, "Code must be 6 numbers"),
});

export type LoginOtpValues = z.infer<typeof loginOtpSchema>;
