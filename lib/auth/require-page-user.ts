import { redirect } from "next/navigation";

import { getRequestUser } from "@/lib/auth/require-user";

/** Server page guard — dedupes auth via `getRequestUser` within the same request. */
export async function requirePageUser() {
  const user = await getRequestUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
