"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Smallest clips first so the first frame appears immediately. */
const LOGIN_VIDEOS = [
  "/videos/login-3.mp4",
  "/videos/login-2.mp4",
  "/videos/login-1.mp4",
] as const;

const HEAVY_VIDEO_INDEX = 2;

function prepVideo(video: HTMLVideoElement) {
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
}

async function playVideo(video: HTMLVideoElement) {
  prepVideo(video);
  try {
    await video.play();
  } catch {
    // Autoplay may be blocked until the first gesture.
  }
}

function assignSrc(video: HTMLVideoElement, src: string) {
  if (video.dataset.src === src) return;
  video.dataset.src = src;
  video.src = src;
  video.load();
}

export function LoginVideoBackground() {
  const slotsRef = useRef<[HTMLVideoElement | null, HTMLVideoElement | null]>([
    null,
    null,
  ]);
  const heavyPreloadRef = useRef<HTMLVideoElement>(null);
  const indexRef = useRef(0);
  const heavyPreloadStartedRef = useRef(false);

  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);

  const preloadIntoSlot = useCallback((slot: 0 | 1, index: number) => {
    const video = slotsRef.current[slot];
    if (!video) return;
    assignSrc(video, LOGIN_VIDEOS[index]);
  }, []);

  const startHeavyPreload = useCallback(() => {
    if (heavyPreloadStartedRef.current) return;
    heavyPreloadStartedRef.current = true;
    const heavy = heavyPreloadRef.current;
    if (!heavy) return;
    assignSrc(heavy, LOGIN_VIDEOS[HEAVY_VIDEO_INDEX]);
  }, []);

  const advance = useCallback(
    (endedSlot: 0 | 1) => {
      const nextIndex = (indexRef.current + 1) % LOGIN_VIDEOS.length;
      const nextSlot = (1 - endedSlot) as 0 | 1;

      indexRef.current = nextIndex;
      setActiveSlot(nextSlot);

      const nextVideo = slotsRef.current[nextSlot];
      if (nextVideo) {
        nextVideo.currentTime = 0;
        void playVideo(nextVideo);
      }

      const preloadIndex = (nextIndex + 1) % LOGIN_VIDEOS.length;
      preloadIntoSlot(endedSlot, preloadIndex);

      if (preloadIndex === HEAVY_VIDEO_INDEX) {
        startHeavyPreload();
      }
    },
    [preloadIntoSlot, startHeavyPreload],
  );

  useEffect(() => {
    preloadIntoSlot(0, 0);
    preloadIntoSlot(1, 1);
    const first = slotsRef.current[0];
    if (first && first.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void playVideo(first);
    }
  }, [preloadIntoSlot]);

  useEffect(() => {
    const unlock = () => {
      const video = slotsRef.current[activeSlot];
      if (video) void playVideo(video);
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, [activeSlot]);

  const onSlotCanPlay = useCallback(
    (slot: 0 | 1) => {
      if (slot !== activeSlot) return;
      const video = slotsRef.current[slot];
      if (video?.paused) void playVideo(video);
    },
    [activeSlot],
  );

  const onSlotPlaying = useCallback(
    (slot: 0 | 1) => {
      if (slot !== activeSlot) return;
      startHeavyPreload();
    },
    [activeSlot, startHeavyPreload],
  );

  return (
    <div className="fixed inset-0 z-0 bg-black" aria-hidden>
      {([0, 1] as const).map((slot) => (
        <video
          key={slot}
          ref={(node) => {
            slotsRef.current[slot] = node;
          }}
          className={
            slot === activeSlot
              ? "absolute inset-0 h-full w-full object-cover"
              : "pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
          }
          muted
          playsInline
          autoPlay={slot === 0}
          preload="auto"
          fetchPriority={slot === 0 ? "high" : "low"}
          onEnded={() => advance(slot)}
          onCanPlay={() => onSlotCanPlay(slot)}
          onPlaying={() => onSlotPlaying(slot)}
        />
      ))}
      {/* Warm cache for the large clip without blocking the first frame. */}
      <video
        ref={heavyPreloadRef}
        className="hidden"
        muted
        playsInline
        preload="none"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  );
}
