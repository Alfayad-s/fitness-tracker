"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid h-11 grid-cols-3 gap-2">
          <div className="animate-pulse rounded-lg bg-muted" />
          <div className="animate-pulse rounded-lg bg-muted" />
          <div className="animate-pulse rounded-lg bg-muted" />
        </div>
      </section>
    );
  }

  const active = (theme ?? "system") as ThemeOption;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-medium">Appearance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose light, dark, or match your device setting.
      </p>

      <div
        className="mt-4 grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Color theme"
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = active === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
