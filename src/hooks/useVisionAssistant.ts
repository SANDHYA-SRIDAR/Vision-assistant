import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;


/* ---------------- TEXT NORMALIZE ---------------- */
function normalize(text: string) {
  return text.toLowerCase().replace(/[.,!?]/g, "").trim();
}


/* ---------------- SPLIT LONG TEXT ---------------- */
function splitIntoSentences(text: string) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/);
}


/* ---------------- WORD SIMILARITY ---------------- */
function similarity(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] =
          1 +
          Math.min(
            matrix[j - 1][i],
            matrix[j][i - 1],
            matrix[j - 1][i - 1]
          );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  return 1 - distance / Math.max(a.length, b.length);
}


/* ---------------- SPEAK DATE & TIME ---------------- */
function getSpokenDateTime() {

  const now = new Date();

  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${weekday}, ${date}. Time ${hours}:${minutes} ${period}.`;
}


export function useVisionAssistant() {

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const assistantTalking = useRef(false);
  const cooldown = useRef(false);


  /* ---------------- SPEAK (MIC PAUSES WHILE TALKING) ---------------- */
  const speak = (text: string) => {

    // Pause microphone recognition while assistant talks
    try {
      recognitionRef.current?.stop();
    } catch {}

    window.speechSynthesis.cancel();

    const parts = splitIntoSentences(text);
    let index = 0;

    assistantTalking.current = true;

    const speakNext = () => {

      if (index >= parts.length) {
        assistantTalking.current = false;

        // Restart microphone after speaking
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 250);

        return;
      }

      const utterance = new SpeechSynthesisUtterance(parts[index]);
      utterance.rate = 1.0;
      utterance.volume = 0.45;

      utterance.onend = () => {
        index++;
        setTimeout(speakNext, 120);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };


  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    assistantTalking.current = false;

    // reopen mic immediately
    setTimeout(() => {
      try { recognitionRef.current?.start(); } catch {}
    }, 200);

  }, []);


  /* ---------------- ANALYZE IMAGE ---------------- */
  const analyzeImage = useCallback(async (imageData: string) => {

    setIsProcessing(true);
    speak("Scanning surroundings.");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-scene', {
        body: { imageData },
      });

      if (error) throw error;

      const resultText = data?.description || "I could not identify anything.";
      setDescription(resultText);
      speak(resultText);

    } catch {
      speak("Analysis failed.");
    }
    finally {
      setIsProcessing(false);
    }

  }, []);


  /* ---------------- INTENT DETECT ---------------- */
  function detectScanIntent(words: string[]) {
    return words.some(w =>
      similarity(w, "scan") > 0.6 ||
      similarity(w, "can") > 0.85 ||
      similarity(w, "again") > 0.7 ||
      similarity(w, "start") > 0.65 ||
      similarity(w, "look") > 0.6
    );
  }

  function detectStopIntent(words: string[]) {
    return words.some(w =>
      similarity(w, "stop") > 0.65 ||
      similarity(w, "top") > 0.8 ||
      similarity(w, "enough") > 0.55 ||
      similarity(w, "quiet") > 0.6 ||
      similarity(w, "halt") > 0.55
    );
  }


  /* ---------------- START ASSISTANT ---------------- */
  const startAssistant = useCallback(async (onScanReady: () => void) => {

    if (!SpeechRecognition) return;

    await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      }
    });

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;


    recognition.onstart = () => {
      setIsListening(true);

      const intro = getSpokenDateTime();
      speak(intro);

      setTimeout(() => {
        speak("Listening");
      }, 4000);
    };


    recognition.onresult = (event: any) => {

      for (let i = event.resultIndex; i < event.results.length; i++) {

        const result = event.results[i];
        if (!result.isFinal) continue;

        let heard = "";
        for (let alt of result) {
          heard += " " + alt.transcript;
        }

        const text = normalize(heard);
        console.log("Heard:", text);

        const words = text.split(" ");

        if (detectStopIntent(words)) {
          stopSpeaking();
          cooldown.current = true;
          setTimeout(() => cooldown.current = false, 1000);
          return;
        }

        if (assistantTalking.current) return;
        if (cooldown.current) return;

        if (detectScanIntent(words) && !isProcessing) {
          onScanReady();
          cooldown.current = true;
          setTimeout(() => cooldown.current = false, 2000);
          return;
        }
      }
    };


    recognition.onend = () => {
      try { recognition.start(); } catch {}
    };

    recognitionRef.current = recognition;
    recognition.start();

  }, [isProcessing, stopSpeaking]);


  return {
    isListening,
    isProcessing,
    description,
    startAssistant,
    analyzeImage,
    stopSpeaking
  };
}
