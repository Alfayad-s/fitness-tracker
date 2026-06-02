import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress",
};

export default function ProgressPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Charts and body measurements will show up here.
        </p>
      </header>
    </main>
  );
}
