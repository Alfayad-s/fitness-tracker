import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Cached per request — avoids duplicate auth round-trips in one server action chain. */
export const getRequestUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

export async function requireUser(): Promise<
  { user: User } | { error: string }
> {
  const user = await getRequestUser();
  if (!user) {
    return { error: "You must be signed in." };
  }
  return { user };
}
