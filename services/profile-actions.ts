"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/types/schemas/profile";

export async function syncProfileAvatar(avatarUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update your photo." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  if (updateError) {
    return { error: updateError.message };
  }

  try {
    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, user.id));
  } catch {
    return { error: "Photo saved to your account but failed to sync profile." };
  }

  revalidatePath("/profile", "layout");

  return { success: true as const, avatarUrl };
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ success?: true; error?: string }> {
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message =
      first.username?.[0] ??
      first.fullName?.[0] ??
      first.heightCm?.[0] ??
      first.gender?.[0] ??
      first.goalType?.[0] ??
      "Invalid profile data.";
    return { error: message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update your profile." };
  }

  const { username, fullName, gender, heightCm, goalType } = parsed.data;

  if (username) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing && existing.id !== user.id) {
      return { error: "That username is already taken." };
    }
  }

  try {
    await db
      .update(users)
      .set({
        username: username ?? null,
        fullName: fullName ?? null,
        gender: gender ?? null,
        heightCm: heightCm != null ? String(heightCm) : null,
        goalType: goalType ?? null,
      })
      .where(eq(users.id, user.id));
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("unique")
        ? "That username is already taken."
        : "Could not save your profile. Please try again.";
    return { error: message };
  }

  const authMetadata: Record<string, string> = {};
  if (fullName !== undefined) {
    authMetadata.full_name = fullName ?? "";
  }

  if (Object.keys(authMetadata).length > 0) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: authMetadata,
    });
    if (metaError) {
      return {
        error:
          "Profile saved, but your display name could not sync to your login session.",
      };
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/progress");

  return { success: true };
}
