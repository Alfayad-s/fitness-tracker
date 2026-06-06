"use client";

import { useRouter } from "next/navigation";

import { SlideButton } from "@/components/ui/slide-button";

export function SlideToStartWorkout() {
  const router = useRouter();

  return (
    <section className="w-full py-1">
      <SlideButton
        label="Slide to start workout"
        onSlideComplete={() => router.push("/workouts/new")}
        aria-label="Slide to start workout"
      />
    </section>
  );
}
