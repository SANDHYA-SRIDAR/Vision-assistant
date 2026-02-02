import { useEffect, useCallback, useRef } from 'react';

interface AudioFeedbackProps {
  text: string | null;
  onSpeechEnd?: () => void;
}

export function AudioFeedback({ text, onSpeechEnd }: AudioFeedbackProps) {
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);

  const speak = useCallback((message: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use a clear, natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes('Google') ||
        voice.name.includes('Samantha') ||
        voice.name.includes('Daniel') ||
        voice.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      onSpeechEnd?.();
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      onSpeechEnd?.();
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [onSpeechEnd]);

  useEffect(() => {
    if (text) {
      speak(text);
    }
  }, [text, speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return null;
}

// Hook for voice feedback
export function useVoiceFeedback() {
  const speak = useCallback((message: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
