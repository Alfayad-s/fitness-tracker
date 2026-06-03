"use client";

import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AiChatMessages } from "@/components/ai/ai-chat-messages";
import { ReplySpeechProvider, useReplySpeech } from "@/components/ai/reply-speech-provider";
import { AiIntroSplash } from "@/components/ai/ai-intro-splash";
import { BackButton } from "@/components/ui/back-button";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { shouldParseAsBmaReport } from "@/lib/ai/should-parse-bma-upload";
import {
  shouldParseAsNutritionLog,
  shouldParseNutritionFromText,
} from "@/lib/ai/should-parse-nutrition-upload";
import type { BmaExtraction } from "@/types/schemas/bma-report";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";
import type { ChatAttachment, ChatMessage } from "@/types/ai";

const INTRO_DURATION_MS = 2200;

function buildAttachment(
  file: File,
  previewUrlsRef: React.MutableRefObject<string[]>,
): ChatAttachment {
  const type = file.type === "application/pdf" ? "pdf" : "image";
  const previewUrl =
    type === "image" ? URL.createObjectURL(file) : undefined;
  if (previewUrl) {
    previewUrlsRef.current.push(previewUrl);
  }
  return {
    type,
    fileName: file.name,
    previewUrl,
  };
}

function userMessageContent(file: File, note: string): string {
  if (note.trim()) return note.trim();
  if (file.type === "application/pdf") {
    return "Attached PDF";
  }
  return "Attached image";
}

type LoadingKind = "text" | "bma" | "vision" | "nutrition";

function messagesForApi(messages: ChatMessage[]) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

type AiAssistantViewProps = {
  showIntroOnMount?: boolean;
};

function AiAssistantViewInner({
  showIntroOnMount = false,
}: AiAssistantViewProps) {
  const router = useRouter();
  const { stop: stopSpeech } = useReplySpeech();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKind, setLoadingKind] = useState<LoadingKind>("text");
  const [showIntro, setShowIntro] = useState(showIntroOnMount);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(
    null,
  );
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!showIntroOnMount) return;

    const timer = window.setTimeout(() => {
      setShowIntro(false);
      router.replace("/ai", { scroll: false });
    }, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [showIntroOnMount, router]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const handleBmaSaved = useCallback(
    (messageIndex: number, savedContent: string) => {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === messageIndex
            ? {
                ...msg,
                content: savedContent,
                bmaSaved: true,
                bmaExtraction: undefined,
              }
            : msg,
        ),
      );
    },
    [],
  );

  const handleNutritionSaved = useCallback(
    (messageIndex: number, savedContent: string) => {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === messageIndex
            ? {
                ...msg,
                content: savedContent,
                nutritionSaved: true,
                nutritionExtraction: undefined,
              }
            : msg,
        ),
      );
    },
    [],
  );

  const appendAssistantReply = useCallback(
    (nextMessages: ChatMessage[], assistantMessage: ChatMessage) => {
      setMessages([...nextMessages, assistantMessage]);
      setTypingMessageIndex(nextMessages.length);
    },
    [],
  );

  const requestVisionChat = useCallback(
    async (file: File, nextMessages: ChatMessage[]) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("messages", JSON.stringify(messagesForApi(nextMessages)));

      const response = await fetch("/api/ai/chat-image", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        message?: ChatMessage;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not analyze this image. Please try again.");
        return false;
      }

      if (data.message?.content) {
        appendAssistantReply(nextMessages, data.message);
        return true;
      }

      setError("Empty response from AI.");
      return false;
    },
    [appendAssistantReply],
  );

  const requestNutritionScan = useCallback(
    async (
      payload: { file?: File; text?: string; note?: string },
      nextMessages: ChatMessage[],
    ) => {
      let response: Response;

      if (payload.file) {
        const formData = new FormData();
        formData.append("file", payload.file);
        if (payload.note) formData.append("note", payload.note);
        response = await fetch("/api/ai/nutrition-scan", {
          method: "POST",
          body: formData,
        });
      } else if (payload.text) {
        response = await fetch("/api/ai/nutrition-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: payload.text }),
        });
      } else {
        setError("Nothing to scan.");
        return false;
      }

      const data = (await response.json()) as {
        message?: ChatMessage & { nutritionExtraction?: NutritionScanExtraction };
        error?: string;
      };

      if (!response.ok) {
        setError(
          data.error ?? "Could not read meals or hydration. Please try again.",
        );
        return false;
      }

      if (data.message?.content) {
        appendAssistantReply(nextMessages, {
          role: "assistant",
          content: data.message.content,
          nutritionExtraction: data.message.nutritionExtraction,
          nutritionSaved: false,
        });
        return true;
      }

      setError("Empty response from AI.");
      return false;
    },
    [appendAssistantReply],
  );

  const requestBmaScan = useCallback(
    async (file: File, note: string, nextMessages: ChatMessage[]) => {
      const formData = new FormData();
      formData.append("file", file);
      if (note) formData.append("note", note);

      const response = await fetch("/api/ai/bma-scan", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        message?: ChatMessage & { bmaExtraction?: BmaExtraction };
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 422 && file.type.startsWith("image/")) {
          return "fallback-vision" as const;
        }
        setError(
          data.error ?? "Failed to scan body report. Please try again.",
        );
        return false;
      }

      if (data.message?.content) {
        appendAssistantReply(nextMessages, {
          role: "assistant",
          content: data.message.content,
          bmaExtraction: data.message.bmaExtraction,
          bmaSaved: false,
        });
        return true;
      }

      setError("Empty response from AI.");
      return false;
    },
    [appendAssistantReply],
  );

  const handleSend = useCallback(
    async (message: string, files?: File[]) => {
      const trimmed = message.trim();
      const file = files?.[0];
      if ((!trimmed && !file) || isLoading) return;

      setError(null);
      setTypingMessageIndex(null);
      stopSpeech();

      if (file) {
        const attachment = buildAttachment(file, previewUrlsRef);
        const userMessage: ChatMessage = {
          role: "user",
          content: userMessageContent(file, trimmed),
          attachment,
        };
        const nextMessages: ChatMessage[] = [...messages, userMessage];
        setMessages(nextMessages);

        const useBmaScan = shouldParseAsBmaReport(file, trimmed);
        const useNutritionScan = shouldParseAsNutritionLog(file, trimmed);
        setLoadingKind(
          useBmaScan ? "bma" : useNutritionScan ? "nutrition" : "vision",
        );
        setIsLoading(true);

        try {
          if (useBmaScan) {
            const result = await requestBmaScan(file, trimmed, nextMessages);
            if (result === "fallback-vision") {
              setLoadingKind("vision");
              await requestVisionChat(file, nextMessages);
            }
          } else if (useNutritionScan) {
            await requestNutritionScan(
              { file, note: trimmed },
              nextMessages,
            );
          } else {
            await requestVisionChat(file, nextMessages);
          }
        } catch {
          setError("Network error. Check your connection and try again.");
        } finally {
          setIsLoading(false);
          setLoadingKind("text");
        }
        return;
      }

      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);

      const useNutritionScan = shouldParseNutritionFromText(trimmed);
      setLoadingKind(useNutritionScan ? "nutrition" : "text");
      setIsLoading(true);

      try {
        if (useNutritionScan) {
          await requestNutritionScan({ text: trimmed }, nextMessages);
          return;
        }

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });

        const data = (await response.json()) as {
          message?: ChatMessage;
          error?: string;
        };

        if (!response.ok) {
          setError(data.error ?? "Failed to get a response. Please try again.");
          return;
        }

        if (data.message?.content) {
          appendAssistantReply(nextMessages, data.message);
        } else {
          setError("Empty response from AI.");
        }
      } catch {
        setError("Network error. Check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      messages,
      appendAssistantReply,
      requestBmaScan,
      requestNutritionScan,
      requestVisionChat,
      stopSpeech,
    ],
  );

  return (
    <div className="ai-prompt-box relative flex min-h-[100dvh] flex-col bg-white text-neutral-900">
      <header
        className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-[4.75rem] max-w-lg items-center px-4 py-2">
          <BackButton
            className="text-base text-neutral-700 hover:text-neutral-900"
            fallbackHref="/dashboard"
          />
        </div>
      </header>

      <main className="mx-auto flex w-full min-h-0 max-w-lg flex-1 flex-col px-4 pt-4">
        <AiChatMessages
          messages={messages}
          isLoading={isLoading}
          loadingKind={loadingKind}
          error={error}
          typingMessageIndex={typingMessageIndex}
          onTypingComplete={() => setTypingMessageIndex(null)}
          onBmaSaved={handleBmaSaved}
          onNutritionSaved={handleNutritionSaved}
        />
      </main>

      <footer
        className="sticky bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-3 pt-3 backdrop-blur-md"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-full max-w-lg">
          <PromptInputBox
            theme="light"
            isLoading={isLoading}
            placeholder="Ask anything, log a meal, or attach food / BMA photos…"
            onSend={handleSend}
          />
        </div>
      </footer>

      <AnimatePresence>{showIntro && <AiIntroSplash key="ai-intro" />}</AnimatePresence>
    </div>
  );
}

export function AiAssistantView(props: AiAssistantViewProps) {
  return (
    <ReplySpeechProvider>
      <AiAssistantViewInner {...props} />
    </ReplySpeechProvider>
  );
}
