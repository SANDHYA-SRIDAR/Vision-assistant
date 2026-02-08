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

  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#f3f4f6',
      color: '#111',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>

      {/* ---------- TOP STATUS BAR ---------- */}
      <div style={{
        background: '#e5e7eb',
        padding: '16px 20px',
        borderBottom: '1px solid #d1d5db',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '1.1rem',
        fontWeight: 500
      }}>
        <span>Listening for commands</span>

        <div style={{
          background: '#fff',
          padding: '10px 16px',
          borderRadius: '20px',
          textAlign: 'center',
          minWidth: '90px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{day}</div>
          <div style={{ fontWeight: 'bold' }}>{time}</div>
        </div>
      </div>

      {/* ---------- CAMERA PANEL ---------- */}
      <div style={{
        flex: 1,
        margin: '18px',
        borderRadius: '26px',
        overflow: 'hidden',
        background: '#2b2b2b',
        position: 'relative'
      }}>
        <CameraView onCapture={analyzeImage} isProcessing={isProcessing} />

        {!isListening && (
          <div
            onClick={() => startAssistant(handleScanTrigger)}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '1.5rem',
              background: 'rgba(0,0,0,0.6)',
              cursor: 'pointer'
            }}
          >
            Tap anywhere to activate assistant
          </div>
        )}
      </div>

      {/* ---------- BOTTOM SPEECH PANEL ---------- */}
      <div
        onClick={stopSpeaking}
        style={{
          padding: '28px',
          background: 'linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%)',
          borderTop: '1px solid #d1d5db',
          minHeight: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p style={{
          fontSize: '1.3rem',
          lineHeight: 1.6,
          textAlign: 'center',
          color: '#374151',
          maxWidth: '900px'
        }}>
          {description || "Vision Assistant is active. Say 'Scan' when ready."}
        </p>
      </div>

    </div>
  );
};

export default Index;
