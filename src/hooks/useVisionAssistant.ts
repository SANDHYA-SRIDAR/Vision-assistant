import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceFeedback } from '@/components/AudioFeedback';

export function useVisionAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { speak, stop } = useVoiceFeedback();

  const analyzeImage = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    stop(); // Stop any ongoing speech

    // Voice feedback for user
    speak('Analyzing your surroundings');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-scene', {
        body: { imageData },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to analyze image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const resultText = data?.description || 'Unable to describe the scene';
      setDescription(resultText);

      // Automatically speak the result
      setTimeout(() => {
        speak(resultText);
        setIsSpeaking(true);
      }, 300);
    } catch (err) {
      console.error('Vision analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      speak('Sorry, I could not analyze the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [speak, stop]);

  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
    } else if (description) {
      speak(description);
      setIsSpeaking(true);
    }
  }, [isSpeaking, description, speak, stop]);

  const clearResult = useCallback(() => {
    setDescription(null);
    setError(null);
    stop();
    setIsSpeaking(false);
  }, [stop]);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  return {
    isProcessing,
    description,
    error,
    isSpeaking,
    analyzeImage,
    toggleSpeech,
    clearResult,
    handleSpeechEnd,
  };
}
