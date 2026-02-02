import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CameraView } from '@/components/CameraView';
import { ScanButton } from '@/components/ScanButton';
import { StatusDisplay } from '@/components/StatusDisplay';
import { AudioFeedback } from '@/components/AudioFeedback';
import { useVisionAssistant } from '@/hooks/useVisionAssistant';
import { Eye, Info } from 'lucide-react';

const Index = () => {
  const {
    isProcessing,
    description,
    isSpeaking,
    analyzeImage,
    toggleSpeech,
    clearResult,
    handleSpeechEnd,
  } = useVisionAssistant();

  const captureRef = useRef<(() => void) | null>(null);

  const handleCapture = useCallback(
    (imageData: string) => {
      analyzeImage(imageData);
    },
    [analyzeImage]
  );

  const handleScanClick = useCallback(() => {
    // Trigger capture from CameraView
    const video = document.querySelector('video');
    const canvas = document.createElement('canvas');
    if (video && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        handleCapture(imageData);
      }
    }
  }, [handleCapture]);

  const handleRescan = useCallback(() => {
    clearResult();
  }, [clearResult]);

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="safe-area-top px-4 py-3 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Vision Assistant</h1>
            <p className="text-xs text-muted-foreground">AI-powered scene description</p>
          </div>
        </div>
        <button
          className="touch-target rounded-xl hover:bg-secondary transition-colors"
          aria-label="Information and help"
        >
          <Info className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Camera View */}
      <CameraView onCapture={handleCapture} isProcessing={isProcessing} />

      {/* Bottom Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="safe-area-bottom px-4 py-6 bg-gradient-to-t from-background via-background to-transparent"
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* Status Display */}
          <StatusDisplay
            description={description}
            isProcessing={isProcessing}
            isSpeaking={isSpeaking}
            onToggleSpeech={toggleSpeech}
            onRescan={handleRescan}
          />

          {/* Scan Button - Centered */}
          {!description && (
            <div className="flex justify-center pt-2">
              <ScanButton
                onClick={handleScanClick}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Audio Feedback Component */}
      <AudioFeedback
        text={null}
        onSpeechEnd={handleSpeechEnd}
      />

      {/* Screen Reader Instructions */}
      <div className="sr-only" role="region" aria-label="Usage instructions">
        <p>
          This is a vision assistant app for visually impaired users. Point your phone's camera
          at your surroundings and tap the Scan button to hear a description of what's in front
          of you. You can also tap anywhere on the camera view to capture and analyze.
        </p>
      </div>
    </div>
  );
};

export default Index;
