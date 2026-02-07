import { useCallback } from 'react';
import { useVisionAssistant } from '@/hooks/useVisionAssistant';
import { CameraView } from '@/components/CameraView';

const Index = () => {
  const { isListening, isProcessing, description, startAssistant, analyzeImage, stopSpeaking } = useVisionAssistant();

  const handleScanTrigger = useCallback(() => {
    const video = document.querySelector('video');
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        analyzeImage(canvas.toDataURL('image/jpeg', 0.8));
      }
    }
  }, [analyzeImage]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!isListening ? (
        <button onClick={() => startAssistant(handleScanTrigger)} style={{ width: '100%', height: '100%', border: 'none', background: '#0a0a0a', color: '#4ade80', fontSize: '2rem', cursor: 'pointer' }}>
          TAP TO ACTIVATE
        </button>
      ) : (
        <>
          <div style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #333', background: '#000' }}>
            <span style={{ color: isProcessing ? '#fbbf24' : '#4ade80', fontWeight: 'bold' }}>
              {isProcessing ? "ANALYZING..." : "SAY 'SCAN AGAIN' OR 'STOP'"}
            </span>
          </div>
          
          <div style={{ flex: '1', position: 'relative', margin: '12px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #222' }}>
             <CameraView onCapture={analyzeImage} isProcessing={isProcessing} />
          </div>

          <div 
            onClick={stopSpeaking}
            style={{ flex: '0 0 32%', padding: '25px', background: 'linear-gradient(180deg, #111 0%, #000 100%)', overflowY: 'auto', borderTop: '1px solid #333' }}
          >
            <p style={{ fontSize: '1.25rem', textAlign: 'center', color: '#d1d5db', lineHeight: '1.6' }}>
              {description || "Ready for your command. Say 'Scan' to begin."}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;