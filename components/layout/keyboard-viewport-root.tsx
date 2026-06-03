"use client";

import { useKeyboardInset } from "@/hooks/use-keyboard-inset";

export function KeyboardViewportRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardInset();
  return children;
}
