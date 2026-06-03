"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { buildNutritionProgress } from "@/lib/nutrition/daily-progress";
import type { DailyNutritionLog } from "@/lib/db/queries/nutrition";
import type { DailyNutritionTargets } from "@/lib/measurements/daily-nutrition-targets";
import type { NutritionProgress } from "@/lib/nutrition/daily-progress";

type NutritionLogContextValue = {
  log: DailyNutritionLog;
  targets: DailyNutritionTargets;
  progress: NutritionProgress;
  setLog: Dispatch<SetStateAction<DailyNutritionLog>>;
};

const NutritionLogContext = createContext<NutritionLogContextValue | null>(null);

type NutritionLogProviderProps = {
  initialLog: DailyNutritionLog;
  targets: DailyNutritionTargets;
  children: ReactNode;
};

export function NutritionLogProvider({
  initialLog,
  targets,
  children,
}: NutritionLogProviderProps) {
  const [log, setLog] = useState(initialLog);

  const progress = useMemo(
    () => buildNutritionProgress(log, targets),
    [log, targets],
  );

  const value = useMemo(
    () => ({ log, targets, progress, setLog }),
    [log, targets, progress],
  );

  return (
    <NutritionLogContext.Provider value={value}>
      {children}
    </NutritionLogContext.Provider>
  );
}

export function useNutritionLog() {
  const ctx = useContext(NutritionLogContext);
  if (!ctx) {
    throw new Error("useNutritionLog must be used within NutritionLogProvider");
  }
  return ctx;
}
