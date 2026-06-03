"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, RefreshCcw } from "lucide-react";

import { StreakFireIcon } from "@/components/ui/streak-fire-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  StreakCalendar,
  type StreakPeriod,
} from "@/components/ui/streak-calendar";

interface StreakCardProps extends React.HTMLAttributes<HTMLDivElement> {
  streak: StreakPeriod[];
  currentStreak: number;
  longestStreak: number;
  total: number;
  title?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  showHowItWorks?: boolean;
  howItWorksTitle?: string;
  howItWorksItems?: string[];
  defaultHowItWorksOpen?: boolean;
}

const StreakCard = React.forwardRef<HTMLDivElement, StreakCardProps>(
  (
    {
      className,
      streak,
      currentStreak,
      longestStreak,
      total,
      title = "Streak",
      actionLabel = "View Details",
      onActionClick,
      showHowItWorks = true,
      howItWorksTitle = "How do streaks work?",
      howItWorksItems = [
        "Complete at least one workout each day to build your streak.",
        "Each day you log a workout, your streak increases.",
        "Missing a day will reset your streak to 0.",
      ],
      defaultHowItWorksOpen = false,
      ...props
    },
    ref,
  ) => {
    const [isHowItWorksOpen, setIsHowItWorksOpen] = React.useState(
      defaultHowItWorksOpen,
    );
    const howItWorksContentId = React.useId();

    return (
      <section
        ref={ref}
        aria-label="Streak summary card"
        className={cn("rounded-2xl border bg-card p-4 shadow-sm sm:p-5", className)}
        {...props}
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StreakFireIcon size="md" />
            <h3 className="text-lg font-semibold leading-none">{title}</h3>
          </div>
          {onActionClick ? (
            <Button
              variant="link"
              size="sm"
              onClick={onActionClick}
              aria-label={actionLabel}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {actionLabel}
            </Button>
          ) : null}
        </header>

        <p className="mb-4 text-4xl font-semibold leading-none tracking-tight">
          {currentStreak}
          <span className="ml-2 text-xl font-medium text-muted-foreground">
            days
          </span>
        </p>

        <StreakCalendar
          streak={streak}
          view="week"
          startOfWeek={1}
          className="max-w-none"
        />

        <div
          className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed pt-4"
          aria-label="Streak stats"
        >
          <div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-2xl font-semibold leading-tight">
              {longestStreak}
              <span className="ml-1 text-lg font-medium">days</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold leading-tight">{total}</p>
          </div>
        </div>

        {showHowItWorks ? (
          <div className="mt-4 border-t pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3 text-left"
              onClick={() => setIsHowItWorksOpen((prev) => !prev)}
              aria-expanded={isHowItWorksOpen}
              aria-controls={howItWorksContentId}
            >
              <span className="text-base font-semibold">{howItWorksTitle}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  isHowItWorksOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>

            {isHowItWorksOpen ? (
              <div id={howItWorksContentId} className="space-y-3 px-2 pt-4">
                {howItWorksItems.map((item, index) => {
                  const ListIcon =
                    index === 0
                      ? CheckCircle2
                      : index === 2
                        ? RefreshCcw
                        : null;
                  return (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-start gap-3"
                    >
                      {index === 1 ? (
                        <StreakFireIcon size="md" className="mt-0.5" />
                      ) : ListIcon ? (
                        <ListIcon
                          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      ) : null}
                      <p className="text-sm leading-snug text-muted-foreground">
                        {item}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  },
);
StreakCard.displayName = "StreakCard";

export { StreakCard };
export type { StreakCardProps };
