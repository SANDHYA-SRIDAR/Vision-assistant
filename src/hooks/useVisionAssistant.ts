import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useVisionAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  const speak = (text: string) => {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.volume = 0.8;
    
    // When the voice finishes, we tell the mic to wake up
    utterance.onend = () => {
      console.log("Voice finished. Mic is now alert.");
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const analyzeImage = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    speak("Scanning surroundings."); 
    try {
      const { data, error } = await supabase.functions.invoke('analyze-scene', {
        body: { imageData },
      });
      if (error) throw error;
      const resultText = data?.description || "I couldn't identify anything.";
      setDescription(resultText);
      speak(resultText); 
    } catch (err) {
      speak("Analysis failed.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const startAssistant = useCallback((onScanReady: () => void) => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      speak("Assistant active.");
    };
    
    recognition.onresult = (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log("Heard:", text);
      
      // STOP Logic
      if (text.includes("stop") || text.includes("quiet") || text.includes("hush")) {
        stopSpeaking();
      } 
      
      // SCAN AGAIN Logic (Flexible detection)
      if (text.includes("scan again") || text.includes("scan") || text.includes("again")) {
        // Prevent triggering while already processing
        if (!isProcessing) {
          onScanReady();
        }
      }
    };

    // The "Anti-Glitch" Heartbeat
    recognition.onend = () => {
      if (isListening) {
        console.log("Mic timed out, restarting listener...");
        try { recognition.start(); } catch(e) {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, isProcessing, stopSpeaking]);

  return { isListening, isProcessing, description, startAssistant, analyzeImage, stopSpeaking };
}