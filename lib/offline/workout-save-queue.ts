import type { Feeling, WorkoutSession } from "@/types";

const QUEUE_KEY = "fitness-tracker-workout-save-queue";

export type QueuedWorkoutSave = {
  id: string;
  createdAt: string;
  session: WorkoutSession;
  feeling: Feeling | null;
};

function readQueue(): QueuedWorkoutSave[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedWorkoutSave[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedWorkoutSave[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function getQueuedWorkoutSaves(): QueuedWorkoutSave[] {
  return readQueue();
}

export function getQueuedWorkoutSaveCount(): number {
  return readQueue().length;
}

export function enqueueWorkoutSave(
  session: WorkoutSession,
  feeling: Feeling | null,
): QueuedWorkoutSave {
  const item: QueuedWorkoutSave = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    session,
    feeling,
  };
  writeQueue([...readQueue(), item]);
  return item;
}

export function removeQueuedWorkoutSave(id: string): void {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function clearWorkoutSaveQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
}

export function isLikelyOffline(): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  return false;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed to fetch")
    );
  }
  return false;
}
