"use client";

import { Square, Volume2 } from "lucide-react";

import { useReplySpeech } from "@/components/ai/reply-speech-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReadReplyButtonProps = {
  messageId: string;
  text: string;
  className?: string;
  disabled?: boolean;
};

export function ReadReplyButton({
  messageId,
  text,
  className,
  disabled = false,
}: ReadReplyButtonProps) {
  const { supported, toggle, isSpeaking } = useReplySpeech();
  const active = isSpeaking(messageId);

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={disabled || !text.trim()}
      className={cn(
        "mt-2 h-8 gap-1.5 px-2 text-xs text-neutral-600 hover:text-neutral-900",
        active && "bg-neutral-200/80 text-neutral-900",
        className,
      )}
      onClick={() => toggle(messageId, text)}
      aria-label={active ? "Stop reading reply" : "Read reply aloud"}
      aria-pressed={active}
    >
      {active ? (
        <>
          <Square className="size-3.5 fill-current" aria-hidden />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="size-3.5" aria-hidden />
          Read reply
        </>
      )}
    </Button>
  );
}
