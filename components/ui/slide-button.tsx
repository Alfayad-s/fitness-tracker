"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Check, Loader2, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 0.9;
const HANDLE_SIZE_PX = 52;

const ANIMATION_CONFIG = {
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
};

type SlideButtonProps = ComponentProps<typeof Button> & {
  onSlideComplete?: () => void;
  resolveTo?: "success" | "error";
  label?: string;
};

type SlideStatus = "idle" | "loading" | "success" | "error";

function StatusIcon({ status }: { status: SlideStatus }) {
  const icon = useMemo(() => {
    switch (status) {
      case "loading":
        return <Loader2 className="size-6 animate-spin" />;
      case "success":
        return <Check className="size-6" />;
      case "error":
        return <X className="size-6" />;
      default:
        return null;
    }
  }, [status]);

  if (!icon) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {icon}
    </motion.div>
  );
}

const SlideButton = forwardRef<HTMLButtonElement, SlideButtonProps>(
  (
    {
      className,
      onSlideComplete,
      resolveTo = "success",
      label = "Slide to start",
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [status, setStatus] = useState<SlideStatus>("idle");
    const [dragMax, setDragMax] = useState(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement | null>(null);

    const dragX = useMotionValue(0);
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring);
    const dragProgress = useTransform(
      springX,
      [0, Math.max(dragMax, 1)],
      [0, 1],
    );

    useLayoutEffect(() => {
      const track = trackRef.current;
      if (!track) return;

      const updateDragMax = () => {
        setDragMax(Math.max(0, track.clientWidth - HANDLE_SIZE_PX - 16));
      };

      updateDragMax();

      const observer = new ResizeObserver(updateDragMax);
      observer.observe(track);

      return () => observer.disconnect();
    }, []);

    const dragConstraints = useMemo(
      () => ({ left: 0, right: dragMax }),
      [dragMax],
    );

    const handleSubmit = useCallback(() => {
      setStatus("loading");
      window.setTimeout(() => {
        setStatus(resolveTo);
      }, 600);
    }, [resolveTo]);

    useEffect(() => {
      if (status === "success") {
        onSlideComplete?.();
      }
    }, [status, onSlideComplete]);

    const handleDragStart = useCallback(() => {
      if (completed) return;
      setIsDragging(true);
    }, [completed]);

    const handleDragEnd = useCallback(() => {
      if (completed) return;
      setIsDragging(false);

      const progress = dragProgress.get();
      if (progress >= DRAG_THRESHOLD) {
        setCompleted(true);
        handleSubmit();
      } else {
        dragX.set(0);
      }
    }, [completed, dragProgress, dragX, handleSubmit]);

    const handleDrag = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
    ) => {
      if (completed) return;
      const newX = Math.max(0, Math.min(info.offset.x, dragMax));
      dragX.set(newX);
    };

    const adjustedWidth = useTransform(springX, (x) => x + HANDLE_SIZE_PX * 0.5);

    return (
      <div className="w-full">
        <div
          ref={trackRef}
          className="shadow-button-inset relative flex h-14 w-full items-center rounded-full bg-muted sm:h-16"
        >
          {!completed ? (
            <motion.div
              style={{ width: adjustedWidth }}
              className="absolute inset-y-1 left-1 z-0 rounded-full bg-primary/15"
            />
          ) : null}

          <AnimatePresence initial={false}>
            {!completed ? (
              <motion.div
                key="handle"
                ref={dragHandleRef}
                drag="x"
                dragConstraints={dragConstraints}
                dragElastic={0.05}
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                style={{ x: springX }}
                className="absolute left-1 z-10 flex cursor-grab items-center justify-start active:cursor-grabbing"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  ref={ref}
                  disabled={status === "loading"}
                  {...props}
                  size="icon-lg"
                  className={cn(
                    "shadow-button size-[3.25rem] rounded-full sm:size-14",
                    isDragging && "scale-105 transition-transform",
                    className,
                  )}
                >
                  <Play className="size-5 fill-current sm:size-6" />
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {completed ? (
              <motion.div
                key="completed"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  ref={ref}
                  disabled={status === "loading"}
                  {...props}
                  className={cn(
                    "size-full rounded-full transition-all duration-300",
                    className,
                  )}
                >
                  <AnimatePresence mode="wait">
                    <StatusIcon status={status} />
                  </AnimatePresence>
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!completed ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center select-none px-16 text-sm font-medium text-muted-foreground sm:text-base">
              {label}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);

SlideButton.displayName = "SlideButton";

export { SlideButton };
