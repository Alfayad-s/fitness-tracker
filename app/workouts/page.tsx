import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workouts",
};

export default function WorkoutsPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Log and review your training sessions.
        </p>
      </header>
    </main>
  );
}
