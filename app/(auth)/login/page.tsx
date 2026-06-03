import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
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
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Enter your email for a one-time code, or continue with Google or Apple
        </p>
      </header>

      {authErrorMessage && (
        <div className="space-y-1" role="alert">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-center text-base text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {authErrorMessage}
          </p>
          {params.error_description && (
            <p className="text-center text-xs text-muted-foreground">
              {params.error_description}
            </p>
          )}
        </div>
      )}

      <LoginForm next={params.next} />
    </div>
  );
}
