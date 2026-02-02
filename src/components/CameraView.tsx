import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export function CameraView({ onCapture, isProcessing }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
        setCameraError(null);
      } catch (err) {
        console.error('Camera error:', err);
        setHasCamera(false);
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setCameraError('Camera access denied. Please allow camera access to use this app.');
          } else if (err.name === 'NotFoundError') {
            setCameraError('No camera found. Please connect a camera to use this app.');
          } else {
            setCameraError('Unable to access camera. Please check your device settings.');
          }
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    onCapture(imageData);
  }, [onCapture, isProcessing]);

  if (!hasCamera) {
    return (
      <div className="relative flex-1 bg-secondary flex items-center justify-center p-6">
        <div className="status-card text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-accessibility-xl text-foreground mb-2">Camera Unavailable</h2>
          <p className="text-muted-foreground text-lg" role="alert">
            {cameraError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-background">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        aria-label="Camera viewfinder"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder overlay */}
      <div className="viewfinder-frame" aria-hidden="true">
        <div className="viewfinder-corner viewfinder-corner-tl" />
        <div className="viewfinder-corner viewfinder-corner-tr" />
        <div className="viewfinder-corner viewfinder-corner-bl" />
        <div className="viewfinder-corner viewfinder-corner-br" />
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="status-card text-center">
            <div className="listening-indicator mb-4 justify-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="listening-bar" />
              ))}
            </div>
            <p className="text-accessibility-lg text-foreground" role="status" aria-live="polite">
              Analyzing your surroundings...
            </p>
          </div>
        </motion.div>
      )}

      {/* Invisible capture button that covers the whole screen for easy tapping */}
      <button
        onClick={captureImage}
        disabled={isProcessing}
        className="absolute inset-0 w-full h-full opacity-0"
        aria-label="Tap anywhere to capture and analyze"
      />
    </div>
  );
}
