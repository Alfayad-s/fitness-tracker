"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type StreakLayoutContextValue = {
  showStreakPin: boolean;
  setShowStreakPin: (show: boolean) => void;
};

const StreakLayoutContext = createContext<StreakLayoutContextValue | null>(null);

export function StreakLayoutProvider({ children }: { children: ReactNode }) {
  const [showStreakPin, setShowStreakPin] = useState(false);
  const value = useMemo(
    () => ({ showStreakPin, setShowStreakPin }),
    [showStreakPin],
  );

  return (
    <StreakLayoutContext.Provider value={value}>
      {children}
    </StreakLayoutContext.Provider>
  );
}

export function useStreakLayoutPin() {
  const context = useContext(StreakLayoutContext);
  if (!context) {
    throw new Error("useStreakLayoutPin must be used within StreakLayoutProvider");
  }
  return context;
}
