"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENDER_OPTIONS, GOAL_OPTIONS } from "@/lib/profile/labels";
import type { UserProfile } from "@/lib/profile/get-user-profile";
import { cn } from "@/lib/utils";
import { updateProfile } from "@/services/profile-actions";
import {
  updateProfileSchema,
  type ProfileFormValues,
} from "@/types/schemas/profile";

type ProfileFormProps = {
  profile: UserProfile;
};

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs",
  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
);

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}
    </label>
  );
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      username: profile.username ?? "",
      fullName: profile.fullName ?? "",
      gender: profile.gender ?? "",
      heightCm: profile.heightCm ? Number(profile.heightCm) : "",
      goalType: profile.goalType ?? "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setFeedback(null);
    const parsed = updateProfileSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (messages?.[0]) {
          setError(field as keyof ProfileFormValues, { message: messages[0] });
        }
      }
      setFeedback({ type: "error", message: "Please fix the highlighted fields." });
      return;
    }
    const result = await updateProfile(parsed.data);

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    setFeedback({ type: "success", message: "Profile saved." });
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4"
    >
      <div>
        <h2 className="text-base font-semibold">Personal details</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update how you appear in the app.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Your name"
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="fitness_fan"
          aria-invalid={!!errors.username}
          {...register("username")}
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="gender">Gender</Label>
        <select
          id="gender"
          className={selectClassName}
          aria-invalid={!!errors.gender}
          {...register("gender")}
        >
          <option value="">Not set</option>
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.gender && (
          <p className="text-sm text-destructive">{errors.gender.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="heightCm">Height (cm)</Label>
        <Input
          id="heightCm"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={50}
          max={300}
          placeholder="175"
          aria-invalid={!!errors.heightCm}
          {...register("heightCm")}
        />
        {errors.heightCm && (
          <p className="text-sm text-destructive">{errors.heightCm.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goalType">Fitness goal</Label>
        <select
          id="goalType"
          className={selectClassName}
          aria-invalid={!!errors.goalType}
          {...register("goalType")}
        >
          <option value="">Select a goal</option>
          {GOAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.goalType && (
          <p className="text-sm text-destructive">{errors.goalType.message}</p>
        )}
      </div>

      {feedback && (
        <p
          role="alert"
          className={cn(
            "rounded-lg border px-3 py-2 text-center text-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
          )}
        >
          {feedback.message}
        </p>
      )}

      <Button
        type="submit"
        className="h-12 w-full text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}
