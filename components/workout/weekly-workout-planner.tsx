"use client";

import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  addDaysToDateString,
  formatPlanDateHeading,
} from "@/lib/workout/plan-dates";
import { formatWeekRangeLabel } from "@/lib/workout/week-schedule";
import { todayDateString } from "@/lib/workout/format";
import {
  assignTemplateToPlanDayAction,
  fetchWeekSchedule,
  setRestDayForPlanDateAction,
  suggestDailyWorkoutPlanAction,
} from "@/services/daily-plan-actions";
import type { WeekDayDisplayStatus, WeekScheduleDay } from "@/lib/workout/week-schedule";
import type { WorkoutTemplateSummary } from "@/types/schemas/workout-template";
import { cn } from "@/lib/utils";

type WeeklyWorkoutPlannerProps = {
  initialWeekStart: string;
  initialDays: WeekScheduleDay[];
  templates: WorkoutTemplateSummary[];
};

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const STATUS_STYLES: Record<WeekDayDisplayStatus, string> = {
  empty: "border-dashed border-border bg-muted/20 text-muted-foreground",
  rest: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  skipped: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  planned: "border-primary/30 bg-primary/5 text-foreground",
  completed: "border-muted bg-muted/40 text-muted-foreground",
  "program-rest": "border-dashed border-emerald-500/20 bg-emerald-500/5 text-emerald-600/80",
  "program-workout": "border-dashed border-primary/20 bg-primary/5 text-muted-foreground",
};

function DayCard({
  day,
  selected,
  onSelect,
}: {
  day: WeekScheduleDay;
  selected: boolean;
  onSelect: () => void;
}) {
  const subtitle =
    day.displayTitle ??
    (day.displayStatus === "empty" ? "Plan" : day.displayStatus);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors",
        STATUS_STYLES[day.displayStatus],
        day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        selected && "border-primary",
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
        {day.weekdayLabel}
      </span>
      <span className="text-lg font-semibold leading-none">{day.dayOfMonth}</span>
      <span className="line-clamp-2 text-[10px] leading-tight">{subtitle}</span>
    </button>
  );
}

export function WeeklyWorkoutPlanner({
  initialWeekStart,
  initialDays,
  templates,
}: WeeklyWorkoutPlannerProps) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [days, setDays] = useState(initialDays);
  const [selectedDay, setSelectedDay] = useState<WeekScheduleDay | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const refreshWeek = useCallback(async (start: string) => {
    const result = await fetchWeekSchedule(start);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setWeekStart(result.weekStart);
    setDays(result.days);
    setError(null);
  }, []);

  const openDay = (day: WeekScheduleDay) => {
    setSelectedDay(day);
    setSelectedTemplateId(day.plan?.templateId ?? "");
    setError(null);
    setSheetOpen(true);
  };

  const handleWeekShift = async (delta: number) => {
    setBusy("week");
    const nextStart = addDaysToDateString(weekStart, delta);
    await refreshWeek(nextStart);
    setBusy(null);
  };

  const runAction = async (
    key: string,
    action: () => Promise<{ error?: string; plan?: unknown }>,
  ) => {
    setBusy(key);
    setError(null);
    const result = await action();
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    await refreshWeek(weekStart);
    router.refresh();
    setSheetOpen(false);
  };

  const handleRestDay = () => {
    if (!selectedDay) return;
    void runAction("rest", () => setRestDayForPlanDateAction(selectedDay.planDate));
  };

  const handleAiSuggest = () => {
    if (!selectedDay) return;
    void runAction("ai", () =>
      suggestDailyWorkoutPlanAction(selectedDay.planDate),
    );
  };

  const handleAssignTemplate = () => {
    if (!selectedDay || !selectedTemplateId) return;
    void runAction("template", () =>
      assignTemplateToPlanDayAction(selectedDay.planDate, selectedTemplateId),
    );
  };

  const selectedHasWorkout =
    selectedDay?.plan &&
    selectedDay.plan.exercises.length > 0 &&
    selectedDay.displayStatus !== "skipped" &&
    selectedDay.displayStatus !== "rest";

  const selectedIsRest =
    selectedDay?.displayStatus === "rest" ||
    selectedDay?.displayStatus === "skipped";

  const planLink = selectedDay
    ? `/workouts/new?planDate=${encodeURIComponent(selectedDay.planDate)}&from=plan`
    : "/workouts/new";

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Weekly plan</h2>
          <p className="text-xs text-muted-foreground">
            Tap a day to set rest, AI suggest, or add a workout.
          </p>
        </div>
        <Link href="/ai" className="shrink-0 text-xs font-medium underline">
          AI coach
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={busy === "week"}
          onClick={() => void handleWeekShift(-7)}
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-medium">
          {formatWeekRangeLabel(weekStart, todayDateString())}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={busy === "week"}
          onClick={() => void handleWeekShift(7)}
          aria-label="Next week"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className={cn("flex gap-2 overflow-x-auto pb-1", hideScrollbar)}>
        {days.map((day) => (
          <DayCard
            key={day.planDate}
            day={day}
            selected={selectedDay?.planDate === day.planDate && sheetOpen}
            onSelect={() => openDay(day)}
          />
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          {selectedDay ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {formatPlanDateHeading(selectedDay.planDate, todayDateString())}
                </SheetTitle>
                <SheetDescription>
                  {selectedDay.displayTitle
                    ? selectedDay.displayTitle
                    : "No workout planned yet."}
                  {selectedDay.programHint && !selectedDay.plan ? (
                    <span className="mt-1 block text-xs">
                      Program default:{" "}
                      {selectedDay.programHint.isRestDay
                        ? "Rest"
                        : (selectedDay.programHint.templateName ??
                          selectedDay.programHint.label ??
                          "Workout")}
                    </span>
                  ) : null}
                </SheetDescription>
              </SheetHeader>

              {selectedDay.plan?.exercises.length ? (
                <ul className="space-y-1 px-4 text-sm text-muted-foreground">
                  {selectedDay.plan.exercises.slice(0, 6).map((ex) => (
                    <li key={ex.exerciseId ?? ex.exerciseName}>
                      • {ex.exerciseName}
                      {ex.targetSets
                        ? ` — ${ex.targetSets}×${ex.targetReps ?? "?"}`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : null}

              {error ? (
                <p className="px-4 text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <SheetFooter className="gap-2 sm:flex-col">
                <Button
                  type="button"
                  variant={selectedIsRest ? "secondary" : "outline"}
                  className="w-full justify-start"
                  disabled={busy != null || selectedIsRest}
                  onClick={handleRestDay}
                >
                  {busy === "rest" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <BedDouble className="size-4" />
                  )}
                  Set as rest day
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  disabled={busy != null}
                  onClick={handleAiSuggest}
                >
                  {busy === "ai" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {selectedDay.plan ? "Regenerate with AI" : "Suggest with AI"}
                </Button>

                {templates.length > 0 ? (
                  <div className="flex w-full flex-col gap-2">
                    <Select
                      value={selectedTemplateId}
                      onValueChange={setSelectedTemplateId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={busy != null || !selectedTemplateId}
                      onClick={handleAssignTemplate}
                    >
                      {busy === "template" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Use template"
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    <Link href="/workouts/templates" className="underline">
                      Create a template
                    </Link>{" "}
                    to assign workouts to days.
                  </p>
                )}

                {selectedHasWorkout ? (
                  <Button type="button" className="w-full" asChild>
                    <Link href={planLink}>View & start workout</Link>
                  </Button>
                ) : null}
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
