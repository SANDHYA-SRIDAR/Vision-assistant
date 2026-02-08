import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceFeedback } from '@/components/AudioFeedback';

type Mode = 'IDLE' | 'WAIT_SCAN';

export function useVisionAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const modeRef = useRef<Mode>('IDLE');

  const { speak } = useVoiceFeedback();

  /* ---------------- helpers ---------------- */

  const wait = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

  const speakSlow = (text: string) => {
    speak(text, { rate: 0.6, pitch: 1, volume: 1 });
  };

  const stopListening = () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  };

  const listenOnce = (onText: (text: string) => void) => {
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    stopListening();

    const recognition = new SR();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      onText(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const extractScanCommand = (text: string) => {
    if (/\brescan\b/.test(text)) return 'rescan';
    if (/\bscan\b/.test(text)) return 'scan';
    return null;
  };

  /* ---------------- INTRO ---------------- */

  const speakIntro = async () => {
    stopListening();

    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const isPM = hours >= 12;
    hours = hours % 12 || 12;

    // 🔒 Year spoken digit-by-digit (bulletproof)
    speakSlow(`Date is ${day} of ${month}.`);
    await wait(2800);

    speakSlow(`Year two thousand.`);
    await wait(1800);

    speakSlow(`Twenty six.`);
    await wait(1800);

    speakSlow(`Day ${weekday}.`);
    await wait(2200);

    speakSlow(
      `Time is ${hours} ${
        minutes ? minutes.toString() : "o'clock"
      } ${isPM ? 'P E M' : 'A E M'}.`
    );
    await wait(3200);

    speakSlow('Say scan to proceed.');
    await wait(1800);
    speakSlow('Say rescan to scan again.');

    // 🔑 WAIT UNTIL ALL SPEECH IS DONE
    await wait(2500);

    modeRef.current = 'WAIT_SCAN';
    waitForScan();
  };

  /* ---------------- WAIT FOR SCAN ---------------- */

  const waitForScan = () => {
    listenOnce((text) => {
      if (modeRef.current !== 'WAIT_SCAN') return;

      const cmd = extractScanCommand(text);
      if (cmd) {
        setIsProcessing(true);
        speak('Analyzing surroundings.');
        triggerScan();
      } else {
        waitForScan(); // keep waiting
      }
    });
  };

  /* ---------------- SCAN TRIGGER ---------------- */

  let triggerScan = () => {};

  const startAssistant = (onScan: () => void) => {
    triggerScan = onScan;

    listenOnce(() => {
      if (modeRef.current === 'IDLE') {
        speakIntro();
      }
    });
  };

  /* ---------------- IMAGE ANALYSIS ---------------- */

  const analyzeImage = useCallback(
    async (imageData: string) => {
      stopListening();

      try {
        const { data } = await supabase.functions.invoke(
          'analyze-scene',
          { body: { imageData } }
        );

        const result =
          data?.description ||
          'I could not clearly understand the surroundings.';

        setDescription(result);
        speakSlow(result);

      } catch {
        speakSlow('Sorry, I could not analyze the surroundings.');
      } finally {
        setIsProcessing(false);

        // 🔁 READY FOR NEXT SCAN
        await wait(2500);
        modeRef.current = 'WAIT_SCAN';
        waitForScan();
      }
    },
    []
  );

  return {
    isProcessing,
    description,
    startAssistant,
    analyzeImage,
  };
}
