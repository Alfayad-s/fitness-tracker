import type { User as SupabaseUser } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import { syncUserFromAuth } from "@/lib/auth/sync-user";
import { db } from "@/lib/db";
import { logDbError } from "@/lib/db/errors";
import { users } from "@/lib/db/schema";

export type UserProfile = {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  gender: (typeof users.$inferSelect)["gender"];
  heightCm: string | null;
  goalType: (typeof users.$inferSelect)["goalType"];
};

function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function resolveAuthFullName(authUser: SupabaseUser): string | null {
  return (
    metadataString(authUser.user_metadata, "full_name") ??
    metadataString(authUser.user_metadata, "name")
  );
}

function resolveAuthAvatarUrl(authUser: SupabaseUser): string | null {
  return (
    metadataString(authUser.user_metadata, "avatar_url") ??
    metadataString(authUser.user_metadata, "picture")
  );
}

function profileFromAuth(authUser: SupabaseUser): UserProfile {
  return {
    id: authUser.id,
    email: authUser.email ?? "",
    username: null,
    fullName: resolveAuthFullName(authUser),
    avatarUrl: resolveAuthAvatarUrl(authUser),
    gender: null,
    heightCm: null,
    goalType: null,
  };
}

/** Load profile from Drizzle, syncing from Auth on first visit. */
export async function getUserProfile(
  authUser: SupabaseUser,
): Promise<UserProfile> {
  try {
    let [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!row) {
      await syncUserFromAuth(authUser);
      [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, authUser.id))
        .limit(1);
    }

    const email = row?.email ?? authUser.email ?? "";

    return {
      id: authUser.id,
      email,
      username: row?.username ?? null,
      fullName: row?.fullName ?? resolveAuthFullName(authUser),
      avatarUrl: row?.avatarUrl ?? resolveAuthAvatarUrl(authUser),
      gender: row?.gender ?? null,
      heightCm: row?.heightCm ?? null,
      goalType: row?.goalType ?? null,
    };
  } catch (error) {
    logDbError("getUserProfile", error);
    return profileFromAuth(authUser);
  }
}
