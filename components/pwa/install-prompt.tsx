"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "fitness-tracker-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS legacy
    window.navigator.standalone === true
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;

    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    setDismissed(false);

    if (isIos()) {
      setShowIosHint(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setDeferred(null);
    setShowIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (dismissed || isStandalone()) return null;
  if (!deferred && !showIosHint) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-[60] mx-auto max-w-lg px-4",
        "bottom-[calc(var(--app-nav-offset,6.25rem)+var(--keyboard-inset,0px))] md:bottom-4 md:pl-[calc(14rem+1rem)]",
      )}
      role="dialog"
      aria-label="Install app"
    >
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Install Fitness Tracker</p>
          {showIosHint ? (
            <p className="mt-1 text-muted-foreground">
              Tap <Share className="inline size-4 align-text-bottom" /> Share,
              then <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              Add to your home screen for quick access offline.
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {!showIosHint && deferred && (
            <Button
              type="button"
              size="touch"
              className="gap-1.5"
              onClick={install}
            >
              <Download className="size-4" />
              Install
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-touch"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
