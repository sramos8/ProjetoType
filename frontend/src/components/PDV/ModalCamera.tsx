import { useRef, useState, useCallback, useEffect } from 'react';
import { useCameraBarcode } from '../../hooks/useCameraBarcode';

interface Props {
  aberto: boolean;
  onLeitura: (codigo: string) => void;
  onFechar: () => void;
}

export function ModalCamera({ aberto, onLeitura, onFechar }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro]   = useState('');
  const [lido, setLido]   = useState('');
  const [dica, setDica]   = useState(0);

  // Dicas rotativas para ajudar o usuário
  const dicas = [
    'Centralize o código na mira',
    'Mantenha o celular firme e parado',
    'Aproxime mais o celular do código',
    'Certifique-se de boa iluminação',
    'Aguarde o foco automático estabilizar',
  ];

  useEffect(() => {
    if (!aberto) return;
    const t = setInterval(() => setDica(d => (d + 1) % dicas.length), 3000);
    return () => clearInterval(t);
  }, [aberto]);

  const handleLeitura = useCallback((codigo: string) => {
    setLido(codigo);
    // Vibra o celular ao ler (se suportado)
    if (navigator.vibrate) navigator.vibrate(100);
    setTimeout(() => {
      onLeitura(codigo);
      onFechar();
      setLido('');
    }, 700);
  }, [onLeitura, onFechar]);

  useCameraBarcode({
    videoRef,
    ativo: aberto,
    onLeitura: handleLeitura,
    onErro: setErro,
  });

  if (!aberto) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      zIndex: 1000,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.8)', flexShrink: 0,
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📷</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#F5DEB3', fontWeight: 700 }}>
              Leitor de Código de Barras
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#A07850' }}>
              Aponte a câmera para o código
            </div>
          </div>
        </div>
        <button onClick={onFechar} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', borderRadius: '0.5rem', padding: '0.5rem 1rem',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
        }}>
          ✕ Fechar
        </button>
      </div>

      {/* Vídeo — ocupa toda a tela */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          muted
          playsInline
          autoPlay
        />

        {/* Overlay escuro nas bordas — destaca a área de leitura */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Topo */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '25%', background: 'rgba(0,0,0,0.55)' }} />
          {/* Base */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', background: 'rgba(0,0,0,0.55)' }} />
          {/* Esquerda */}
          <div style={{ position: 'absolute', top: '25%', left: 0, width: '8%', bottom: '25%', background: 'rgba(0,0,0,0.55)' }} />
          {/* Direita */}
          <div style={{ position: 'absolute', top: '25%', right: 0, width: '8%', bottom: '25%', background: 'rgba(0,0,0,0.55)' }} />
        </div>

        {/* Mira central */}
        <div style={{
          position: 'absolute',
          top: '25%', left: '8%', right: '8%', bottom: '25%',
          pointerEvents: 'none',
        }}>
          {/* Cantos */}
          {[
            { top: 0,    left: 0,    borderTop: '3px solid #C8822A', borderLeft: '3px solid #C8822A'  },
            { top: 0,    right: 0,   borderTop: '3px solid #C8822A', borderRight: '3px solid #C8822A' },
            { bottom: 0, left: 0,    borderBottom: '3px solid #C8822A', borderLeft: '3px solid #C8822A'  },
            { bottom: 0, right: 0,   borderBottom: '3px solid #C8822A', borderRight: '3px solid #C8822A' },
          ].map((st, i) => (
            <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...st }} />
          ))}

          {/* Linha de scan */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, transparent 0%, #C8822A 30%, #F59E0B 50%, #C8822A 70%, transparent 100%)',
            boxShadow: '0 0 8px #C8822A',
            animation: 'scanLine 2s ease-in-out infinite',
          }} />
        </div>

        {/* Feedback de leitura */}
        {lido && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,185,129,0.9)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 3,
          }}>
            <span style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>✅</span>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
              Código lido!
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.4rem' }}>
              {lido}
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{
            position: 'absolute', bottom: '28%', left: '5%', right: '5%',
            background: 'rgba(239,68,68,0.9)', borderRadius: '0.75rem',
            padding: '0.85rem 1rem', zIndex: 3,
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#fff', textAlign: 'center',
          }}>
            ⚠️ {erro}
          </div>
        )}
      </div>

      {/* Footer — dica rotativa */}
      {!lido && !erro && (
        <div style={{
          padding: '0.85rem 1.25rem', background: 'rgba(0,0,0,0.8)',
          textAlign: 'center', flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
            color: '#A07850', transition: 'opacity 0.3s',
          }}>
            💡 {dicas[dica]}
          </div>
          <div style={{ marginTop: '0.4rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#6B7280' }}>
            EAN-13 · EAN-8 · Code128 · QR Code
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 5%; }
          50%  { top: 90%; }
          100% { top: 5%; }
        }
      `}</style>
    </div>
  );
}