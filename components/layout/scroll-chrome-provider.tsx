"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import { useScrollChrome } from "@/hooks/use-scroll-chrome";

const ScrollChromeContext = createContext(true);

export function ScrollChromeProvider({ children }: { children: ReactNode }) {
  const chromeVisible = useScrollChrome();

  return (
    <ScrollChromeContext.Provider value={chromeVisible}>
      {children}
    </ScrollChromeContext.Provider>
  );
}

export function useScrollChromeVisible(): boolean {
  return useContext(ScrollChromeContext);
}
