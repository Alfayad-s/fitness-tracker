"use client";

import { FileText, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { BmaSaveButton } from "@/components/ai/bma-save-button";
import { NutritionSaveButton } from "@/components/ai/nutrition-save-button";
import { ReadReplyButton } from "@/components/ai/read-reply-button";
import { useReplySpeech } from "@/components/ai/reply-speech-provider";
import { TypewriterText } from "@/components/ai/typewriter-text";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/ai";

type LoadingKind = "text" | "bma" | "vision" | "nutrition";

const LOADING_LABEL: Record<LoadingKind, string> = {
  text: "Thinking…",
  bma: "Reading body report…",
  vision: "Analyzing image…",
  nutrition: "Reading meals & hydration…",
};

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

type AiChatMessagesProps = {
  messages: ChatMessage[];
  isLoading?: boolean;
  loadingKind?: LoadingKind;
  error?: string | null;
  typingMessageIndex?: number | null;
  onTypingComplete?: () => void;
  onBmaSaved?: (messageIndex: number, savedContent: string) => void;
  onNutritionSaved?: (messageIndex: number, savedContent: string) => void;
  /** Speak assistant reply when typewriter animation finishes. */
  autoReadReply?: boolean;
};

function UserMessageBubble({ message }: { message: ChatMessage }) {
  const { attachment } = message;

  return (
    <div className="flex flex-col gap-2">
      {attachment?.type === "image" && attachment.previewUrl && (
        <div className="overflow-hidden rounded-xl border border-white/20">
          <img
            src={attachment.previewUrl}
            alt={attachment.fileName || "Uploaded report"}
            className="max-h-64 w-full bg-neutral-800/40 object-contain"
          />
        </div>
      )}
      {attachment?.type === "pdf" && (
        <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2">
          <FileText className="size-5 shrink-0 text-white/90" />
          <span className="truncate text-xs text-white/90">
            {attachment.fileName}
          </span>
        </div>
      )}
      <p className="whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}

function AssistantMessageBubble({
  message,
  index,
  typingMessageIndex,
  onTypingComplete,
  onProgress,
  onBmaSaved,
  onNutritionSaved,
  autoReadReply = true,
}: {
  message: ChatMessage;
  index: number;
  typingMessageIndex: number | null;
  onTypingComplete?: () => void;
  onProgress: () => void;
  onBmaSaved?: (messageIndex: number, savedContent: string) => void;
  onNutritionSaved?: (messageIndex: number, savedContent: string) => void;
  autoReadReply?: boolean;
}) {
  const { speak, supported } = useReplySpeech();
  const messageId = `assistant-${index}`;
  const isTyping = index === typingMessageIndex;
  const showBmaSave =
    message.bmaExtraction && !message.bmaSaved && !isTyping;
  const showNutritionSave =
    message.nutritionExtraction && !message.nutritionSaved && !isTyping;

  const handleTypingComplete = () => {
    onTypingComplete?.();
    if (
      autoReadReply &&
      supported &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      speak(messageId, message.content);
    }
  };

  return (
    <div>
      {isTyping ? (
        <TypewriterText
          text={message.content}
          animate
          onComplete={handleTypingComplete}
          onProgress={onProgress}
        />
      ) : (
        <p className="whitespace-pre-wrap">{message.content}</p>
      )}

      {!isTyping && (
        <ReadReplyButton messageId={messageId} text={message.content} />
      )}

      {showBmaSave && message.bmaExtraction && (
        <BmaSaveButton
          extraction={message.bmaExtraction}
          saved={message.bmaSaved}
          onSaved={(savedContent) => onBmaSaved?.(index, savedContent)}
        />
      )}

      {showNutritionSave && message.nutritionExtraction && (
        <NutritionSaveButton
          extraction={message.nutritionExtraction}
          saved={message.nutritionSaved}
          onSaved={(savedContent) => onNutritionSaved?.(index, savedContent)}
        />
      )}

    </div>
  );
}

export function AiChatMessages({
  messages,
  isLoading = false,
  loadingKind = "text",
  error = null,
  typingMessageIndex = null,
  onTypingComplete,
  onBmaSaved,
  onNutritionSaved,
  autoReadReply = true,
}: AiChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, error, typingMessageIndex]);

  const hasMessages = messages.length > 0 || isLoading || error;

  if (!hasMessages) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center pb-6 text-center">
        <img
          src="/gif/ai.gif"
          alt=""
          width={72}
          height={72}
          className="mb-4 h-[4.5rem] w-[4.5rem] rounded-full object-cover"
        />
        <h1 className="text-xl font-semibold text-neutral-900">AI Coach</h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          Share meals, hydration, or body reports. Say &quot;log my meal&quot; or
          attach a food photo to add to Meals &amp; hydration after you confirm.
        </p>
        <ul className="mt-6 space-y-2 text-left text-sm text-neutral-600">
          {[
            "What can you tell from this photo? (attach image)",
            "Scan my InBody report (attach + say scan body report)",
            "I had grilled chicken and rice for lunch (log my meal)",
            "How am I progressing on my main lifts?",
          ].map((example) => (
            <li
              key={example}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
            >
              {example}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4",
        hideScrollbar,
      )}
    >
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              message.role === "user"
                ? "rounded-br-md bg-neutral-900 text-white"
                : "rounded-bl-md border border-neutral-200 bg-neutral-50 text-neutral-900",
            )}
          >
            {message.role === "user" ? (
              <UserMessageBubble message={message} />
            ) : (
              <AssistantMessageBubble
                message={message}
                index={index}
                typingMessageIndex={typingMessageIndex}
                onTypingComplete={onTypingComplete}
                onProgress={scrollToBottom}
                onBmaSaved={onBmaSaved}
                onNutritionSaved={onNutritionSaved}
                autoReadReply={autoReadReply}
              />
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
            <Loader2 className="size-4 animate-spin" />
            {LOADING_LABEL[loadingKind]}
          </div>
        </div>
      )}

      {error && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
