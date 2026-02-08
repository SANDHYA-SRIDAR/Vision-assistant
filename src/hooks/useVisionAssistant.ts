import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceFeedback } from '@/components/AudioFeedback';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useVisionAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { speak, stop } = useVoiceFeedback();
  const recognitionRef = useRef<any>(null);

  const startAssistant = useCallback((onScanReady: () => void) => {
    window.alert("HOOK ACTIVE: Starting Microphone...");
    if (!SpeechRecognition) {
      window.alert("ERROR: Speech recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.onstart = () => {
      setIsListening(true);
      window.alert("MICROPHONE IS ON: Say 'SCAN'");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes("scan") || transcript.includes("speak")) onScanReady();
    };
    recognition.onerror = (event: any) => window.alert("MIC ERROR: " + event.error);
    recognitionRef.current = recognition;
    recognition.start();
  }, [speak]);

  return { isProcessing, description, isListening, startAssistant, analyzeImage: () => {} };
}