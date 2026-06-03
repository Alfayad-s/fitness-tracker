"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6 md:max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        Couldn&apos;t load dashboard
      </h1>
      <p className="text-sm text-muted-foreground">
        Something went wrong while loading your training overview. Try again in
        a moment.
      </p>
      <Button type="button" size="touch" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
