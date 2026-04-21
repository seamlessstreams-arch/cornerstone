"use client";

import { useCallback, useRef, useState } from "react";

type RecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export interface DictationOptions {
  mode?: "append" | "replace";
  lang?: string;
}

export function useDictation(
  onTranscript: (nextText: string, rawChunk: string) => void,
  options?: DictationOptions
) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<RecognitionCtor> | null>(null);
  const mode = options?.mode ?? "append";
  const hasWindow = typeof window !== "undefined";
  const getRecognitionCtor = () => {
    if (!hasWindow) return undefined;
    const win = window as Window & {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    return win.SpeechRecognition ?? win.webkitSpeechRecognition;
  };

  const start = useCallback(() => {
    const Rec = getRecognitionCtor();
    if (!Rec || isListening) {
      if (!Rec) setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new Rec();
    recognition.lang = options?.lang ?? "en-GB";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const chunk = event.results[event.results.length - 1]?.[0]?.transcript?.trim() ?? "";
      if (!chunk) return;
      onTranscript(mode === "replace" ? chunk : chunk, chunk);
    };

    recognition.onerror = () => {
      setError("Dictation error.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setError(null);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [getRecognitionCtor, isListening, mode, onTranscript, options?.lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, error, start, stop, supported: Boolean(getRecognitionCtor()) };
}
