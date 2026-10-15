"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { SpeechRecognitionLike } from "@/types/speech";
import { getSpeechRecognitionConstructor } from "@/utils/agents/speech";

const subscribeToNothing = () => () => {};

export function useSpeechRecognition(onFinalTranscript: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const [isListening, setIsListening] = useState(false);

  const isSupported = useSyncExternalStore(
    subscribeToNothing,
    () => getSpeechRecognitionConstructor() !== null,
    () => false,
  );

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = event => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) onFinalTranscriptRef.current(result[0].transcript.trim());
      }
    };

    const finish = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = finish;
    recognition.onend = finish;

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  return { isSupported, isListening, toggle };
}
