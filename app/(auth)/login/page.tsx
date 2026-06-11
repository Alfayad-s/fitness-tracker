import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { LoginSessionToast } from "@/components/auth/login-session-toast";
import { LoginVideoBackground } from "@/components/auth/login-video-background";
import { PageBackButton } from "@/components/layout/page-back-button";
import { getAuthErrorMessage } from "@/lib/auth/errors";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    error_description?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authErrorMessage = getAuthErrorMessage(params.error);

  return (
    <>
      <link
        rel="preload"
        href="/videos/login-3.mp4"
        as="fetch"
        type="video/mp4"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/videos/login-2.mp4"
        as="fetch"
        type="video/mp4"
        crossOrigin="anonymous"
      />
      <LoginVideoBackground />

      <div className="relative min-h-[100dvh] overflow-hidden">
        {/* Shade from bottom up to screen center — top half stays clear */}
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-black via-black/75 to-transparent"
          aria-hidden
        />

        <div className="relative z-[2] flex min-h-[100dvh] flex-col justify-end px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] sm:px-6">
          <div className="mx-auto w-full max-w-[22rem] sm:max-w-sm">
            <PageBackButton
              className="mb-6 px-0 pt-0 text-white drop-shadow-md [&_button]:text-white [&_button]:hover:text-white/90"
              fallbackHref="/dashboard"
            />

            <div className="space-y-6">
              <header className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-md">
                  Sign in
                </h1>
                <p className="text-base leading-relaxed text-white/85 drop-shadow-sm">
                  Enter your email for a one-time code, or continue with Google
                  or Apple
                </p>
              </header>

              {authErrorMessage && (
                <div className="space-y-1" role="alert">
                  <p className="rounded-xl border border-red-400/40 bg-red-950/70 px-4 py-3.5 text-center text-base text-red-100 backdrop-blur-sm">
                    {authErrorMessage}
                  </p>
                  {params.error_description && (
                    <p className="text-center text-xs text-white/70 drop-shadow-sm">
                      {params.error_description}
                    </p>
                  )}
                </div>
              )}

              <LoginForm next={params.next} overlay />

              <Suspense fallback={null}>
                <LoginSessionToast />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
