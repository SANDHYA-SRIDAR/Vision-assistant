import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

interface ScanButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  isDisabled?: boolean;
}

export function ScanButton({ onClick, isProcessing, isDisabled }: ScanButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={isProcessing || isDisabled}
      className="scan-button relative"
      whileTap={{ scale: 0.92 }}
      aria-label={isProcessing ? 'Processing image, please wait' : 'Tap to scan and describe your surroundings'}
      aria-busy={isProcessing}
    >
      {/* Pulse rings */}
      {!isProcessing && (
        <>
          <span className="scan-button-pulse" style={{ animationDelay: '0s' }} aria-hidden="true" />
          <span className="scan-button-pulse" style={{ animationDelay: '0.5s' }} aria-hidden="true" />
        </>
      )}

      {/* Button content */}
      <span className="relative z-10 flex flex-col items-center gap-1">
        {isProcessing ? (
          <div className="listening-indicator">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="listening-bar" />
            ))}
          </div>
        ) : (
          <>
            <Eye className="w-10 h-10" strokeWidth={2.5} />
            <span className="text-sm font-semibold uppercase tracking-wide">Scan</span>
          </>
        )}
      </span>
    </motion.button>
  );
}
