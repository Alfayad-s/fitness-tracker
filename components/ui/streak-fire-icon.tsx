import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-11 w-11",
  xl: "h-[4.5rem] w-[4.5rem]",
  "2xl": "h-24 w-24",
} as const;

type StreakFireIconProps = {
  className?: string;
  size?: keyof typeof sizeClasses;
};

export function StreakFireIcon({
  className,
  size = "sm",
}: StreakFireIconProps) {
  return (
    <img
      src="/fire.gif"
      alt=""
      width={80}
      height={80}
      className={cn("shrink-0 object-contain", sizeClasses[size], className)}
      aria-hidden
    />
  );
}
