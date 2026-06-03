import type { User as SupabaseUser } from "@supabase/supabase-js";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

function getMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function resolveFullName(authUser: SupabaseUser): string | null {
  return (
    getMetadataString(authUser.user_metadata, "full_name") ??
    getMetadataString(authUser.user_metadata, "name") ??
    null
  );
}

function resolveAvatarUrl(authUser: SupabaseUser): string | null {
  return (
    getMetadataString(authUser.user_metadata, "avatar_url") ??
    getMetadataString(authUser.user_metadata, "picture") ??
    null
  );
}

/** Upsert app `users` row from Supabase Auth user (OAuth or email). */
export async function syncUserFromAuth(authUser: SupabaseUser): Promise<void> {
  const email = authUser.email;

  if (!email) {
    console.warn("[syncUserFromAuth] Skipping user without email:", authUser.id);
    return;
  }

  const fullName = resolveFullName(authUser);
  const avatarUrl = resolveAvatarUrl(authUser);

  await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      fullName,
      avatarUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        fullName,
        avatarUrl,
      },
    });
}
