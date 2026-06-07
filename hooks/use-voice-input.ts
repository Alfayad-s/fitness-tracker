"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceInputMode = "browser" | "server" | "none";

/** Minimal Web Speech API types (not in all TS lib targets). */
interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function getVoiceInputMode(): VoiceInputMode {
  if (getSpeechRecognitionCtor()) return "browser";
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  ) {
    return "server";
  }
  return "none";
}

type UseVoiceInputOptions = {
  onInterimTranscript?: (text: string) => void;
};

export function useVoiceInput(options?: UseVoiceInputOptions) {
  const [mode, setMode] = useState<VoiceInputMode>("none");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalPartsRef = useRef<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setMode(getVoiceInputMode());
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRecognition();
      cleanupStream();
      if (mediaRecorderRef.current?.state !== "inactive") {
        try {
          mediaRecorderRef.current?.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [cleanupStream, stopRecognition]);

  const startBrowserRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return false;

    finalPartsRef.current = [];
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim() ?? "";
        if (!text) continue;
        if (result.isFinal) {
          finalPartsRef.current.push(text);
        } else {
          interim = interim ? `${interim} ${text}` : text;
        }
      }
      const finals = finalPartsRef.current.join(" ").trim();
      const combined = [finals, interim].filter(Boolean).join(" ").trim();
      options?.onInterimTranscript?.(combined);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access denied. Allow mic permission in browser settings."
          : "Voice recognition failed. Try again.",
      );
    };

    recognition.onend = () => {
      if (isRecordingRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          /* restart may fail if stopping */
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [options]);

  const startServerRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(250);
    return mimeType;
  }, []);

  const transcribeBlob = useCallback(async (blob: Blob, mimeType: string) => {
    const formData = new FormData();
    formData.append(
      "audio",
      new File([blob], "recording.webm", { type: mimeType }),
    );

    const response = await fetch("/api/ai/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as { text?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Could not transcribe audio.");
    }
    if (!data.text?.trim()) {
      throw new Error("No speech detected. Try again.");
    }
    return data.text.trim();
  }, []);

  const start = useCallback(async () => {
    if (mode === "none") {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError(null);
    isRecordingRef.current = true;
    setIsRecording(true);
    options?.onInterimTranscript?.("");

    if (mode === "browser") {
      const started = startBrowserRecognition();
      if (!started) {
        isRecordingRef.current = false;
        setIsRecording(false);
        setError("Could not start voice recognition.");
      }
      return;
    }

    try {
      await startServerRecording();
      options?.onInterimTranscript?.("Listening…");
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      setError(
        "Microphone access denied. Allow mic permission to use voice chat.",
      );
    }
  }, [mode, options, startBrowserRecognition, startServerRecording]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (!isRecordingRef.current) return null;

    isRecordingRef.current = false;
    setIsRecording(false);
    setError(null);

    try {
      if (recognitionRef.current) {
        stopRecognition();
        const text = finalPartsRef.current.join(" ").trim();
        finalPartsRef.current = [];
        if (!text) {
          setError("No speech detected. Try again.");
          return null;
        }
        return text;
      }

      setIsProcessing(true);
      const recorder = mediaRecorderRef.current;
      const mimeType = recorder?.mimeType ?? "audio/webm";

      const blob = await new Promise<Blob>((resolve, reject) => {
        if (!recorder || recorder.state === "inactive") {
          reject(new Error("No active recording."));
          return;
        }
        recorder.onstop = () => {
          const b = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          resolve(b);
        };
        recorder.stop();
      });

      cleanupStream();
      mediaRecorderRef.current = null;

      return await transcribeBlob(blob, mimeType);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not process voice message.";
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
      cleanupStream();
    }
  }, [cleanupStream, stopRecognition, transcribeBlob]);

  const cancel = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsProcessing(false);
    setError(null);
    finalPartsRef.current = [];
    stopRecognition();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    cleanupStream();
    options?.onInterimTranscript?.("");
  }, [cleanupStream, options, stopRecognition]);

  return {
    mode,
    isSupported: mode !== "none",
    isRecording,
    isProcessing,
    error,
    setError,
    start,
    stop,
    cancel,
  };
}
