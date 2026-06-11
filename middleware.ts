import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip static assets (including login background videos in /videos).
     * Without this, unauthenticated requests to .mp4 files redirect to /login.
     */
    "/((?!_next/static|_next/image|favicon.ico|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|ico)$|manifest.webmanifest|sw.js|workbox-.*\\.js).*)",
  ],
};
