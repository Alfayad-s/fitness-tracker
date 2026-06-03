"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { textForSpeech } from "@/lib/ai/text-for-speech";

type ReplySpeechContextValue = {
  supported: boolean;
  speakingId: string | null;
  speak: (id: string, text: string) => void;
  stop: () => void;
  toggle: (id: string, text: string) => void;
  isSpeaking: (id: string) => boolean;
};

const ReplySpeechContext = createContext<ReplySpeechContextValue | null>(null);

function getSynth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

export function ReplySpeechProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = getSynth();
    setSupported(Boolean(synth));
    if (!synth) return () => undefined;

    const loadVoices = () => {
      synth.getVoices();
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    const synth = getSynth();
    synth?.cancel();
    utteranceRef.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string) => {
      const synth = getSynth();
      const plain = textForSpeech(text);
      if (!synth || !plain) return;

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(plain);
      utterance.rate = 1;
      utterance.pitch = 1;

      const voices = synth.getVoices();
      const english =
        voices.find((v) => v.lang.startsWith("en") && !v.localService) ??
        voices.find((v) => v.lang.startsWith("en"));
      if (english) utterance.voice = english;

      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setSpeakingId(null);
        }
      };
      utterance.onerror = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setSpeakingId(null);
        }
      };

      utteranceRef.current = utterance;
      setSpeakingId(id);
      synth.speak(utterance);
    },
    [],
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) {
        stop();
      } else {
        speak(id, text);
      }
    },
    [speakingId, speak, stop],
  );

  const isSpeaking = useCallback(
    (id: string) => speakingId === id,
    [speakingId],
  );

  const value = useMemo(
    () => ({
      supported,
      speakingId,
      speak,
      stop,
      toggle,
      isSpeaking,
    }),
    [supported, speakingId, speak, stop, toggle, isSpeaking],
  );

  return (
    <ReplySpeechContext.Provider value={value}>
      {children}
    </ReplySpeechContext.Provider>
  );
}

export function useReplySpeech() {
  const ctx = useContext(ReplySpeechContext);
  if (!ctx) {
    throw new Error("useReplySpeech must be used within ReplySpeechProvider");
  }
  return ctx;
}
