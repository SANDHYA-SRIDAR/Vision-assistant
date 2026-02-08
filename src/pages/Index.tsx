import { useVisionAssistant } from '@/hooks/useVisionAssistant';

const Index = () => {
  const { isListening, startAssistant } = useVisionAssistant();

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {!isListening ? (
        <button 
          onClick={() => startAssistant(() => alert("Scan Triggered!"))}
          style={{ padding: '50px', fontSize: '3rem', cursor: 'pointer', zIndex: 999, background: 'white', color: 'black' }}
        >
          CLICK TO START
        </button>
      ) : (
        <h1 style={{ color: 'white' }}>Assistant is Listening... Say "SCAN"</h1>
      )}
    </div>
  );
};

export default Index;