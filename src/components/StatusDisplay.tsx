import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';

interface StatusDisplayProps {
  description: string | null;
  isProcessing: boolean;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  onRescan: () => void;
}

export function StatusDisplay({
  description,
  isProcessing,
  isSpeaking,
  onToggleSpeech,
  onRescan,
}: StatusDisplayProps) {
  if (!description && !isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="status-card"
      >
        <p className="text-accessibility-lg text-center text-muted-foreground">
          Point your camera and tap <strong className="text-primary">Scan</strong> to describe what's in front of you
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isProcessing ? (
        <motion.div
          key="processing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="status-card"
        >
          <div className="flex items-center gap-4">
            <div className="listening-indicator">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="listening-bar" />
              ))}
            </div>
            <p className="text-accessibility-lg text-foreground" role="status" aria-live="polite">
              Analyzing...
            </p>
          </div>
        </motion.div>
      ) : description ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="status-card"
        >
          <p
            className="text-accessibility-lg text-foreground leading-relaxed mb-4"
            role="status"
            aria-live="polite"
          >
            {description}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onToggleSpeech}
              className="touch-target flex-1 bg-secondary hover:bg-secondary/80 rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors"
              aria-label={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-5 h-5" />
                  <span className="font-medium">Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span className="font-medium">Read Aloud</span>
                </>
              )}
            </button>
            <button
              onClick={onRescan}
              className="touch-target bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors"
              aria-label="Scan again"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">Rescan</span>
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
