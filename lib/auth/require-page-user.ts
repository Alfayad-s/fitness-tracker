import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/lib/auth/routes";
import { getRequestUser } from "@/lib/auth/require-user";

/** Server page guard — dedupes auth via `getRequestUser` within the same request. */
export async function requirePageUser(returnTo?: string) {
  const user = await getRequestUser();
  if (!user) {
    if (returnTo) {
      redirect(
        `${AUTH_ROUTES.login}?next=${encodeURIComponent(returnTo)}`,
      );
    }
    redirect(AUTH_ROUTES.login);
  }
  return user;
}
