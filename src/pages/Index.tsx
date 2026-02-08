import { useCallback, useEffect, useState } from 'react';
import { useVisionAssistant } from '@/hooks/useVisionAssistant';
import { CameraView } from '@/components/CameraView';

const Index = () => {
  const {
    isListening,
    isProcessing,
    description,
    startAssistant,
    analyzeImage,
    stopSpeaking,
  } = useVisionAssistant();

  /* ===============================
     REAL-TIME DATE / DAY / TIME
     =============================== */
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 60_000); // update every minute

    return () => clearInterval(timer);
  }, []);

  const formattedDay = dateTime.toLocaleDateString(undefined, {
    weekday: 'long',
  });

  const formattedDate = dateTime.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = dateTime.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  /* ===============================
     IMAGE SCAN HANDLER
     =============================== */
  const handleScanTrigger = useCallback(() => {
    const video = document.querySelector('video');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    analyzeImage(canvas.toDataURL('image/jpeg', 0.85));
  }, [analyzeImage]);

  /* ===============================
     AUTO START ASSISTANT
     =============================== */
  useEffect(() => {
    if (!isListening) {
      startAssistant(handleScanTrigger);
    }
  }, [isListening, startAssistant, handleScanTrigger]);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[hsl(var(--app-bg))]">
      
      {/* ===============================
          TOP BAR (STATUS + TIME)
         =============================== */}
      <div className="top-bar m-4">
        <span className="status-text text-black">
          {isProcessing ? 'Analyzing surroundings' : 'Listening for commands'}
        </span>

        <div className="time-card ml-4">
          <div className="time-day">{formattedDay}</div>
          <div className="time-clock">{formattedTime}</div>
        </div>
      </div>

      {/* ===============================
          CAMERA / MAIN VIEW
         =============================== */}
      <div className="camera-frame flex-1 mx-4 my-2">
        <CameraView onCapture={analyzeImage} isProcessing={isProcessing} />
      </div>

      {/* ===============================
          SPEECH / DESCRIPTION PANEL
         =============================== */}
      <div
        onClick={stopSpeaking}
        className="speech-panel mx-4 mb-4"
        aria-live="polite"
      >
        <p className="speech-text text-black">
          {description ||
            "Vision Assistant is active. Say 'Scan' when ready."}
        </p>
      </div>
    </div>
  );
};

export default Index;
