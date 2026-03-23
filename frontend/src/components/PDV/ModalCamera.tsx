import { useState, useCallback, useEffect } from 'react';
import { useCameraBarcode } from '../../hooks/useCameraBarcode';

interface Props {
  aberto: boolean;
  onLeitura: (codigo: string) => void;
  onFechar: () => void;
}

const SCANNER_ID = 'html5qr-scanner';

export function ModalCamera({ aberto, onLeitura, onFechar }: Props) {
  const [erro, setErro]   = useState('');
  const [lido, setLido]   = useState('');
  const [dica, setDica]   = useState(0);

  const dicas = [
    'Centralize o código na área iluminada',
    'Mantenha o celular firme e parado',
    'Aproxime mais o celular do código',
    'Certifique-se de boa iluminação',
    'Aguarde o foco automático estabilizar',
  ];

  useEffect(() => {
    if (!aberto) { setErro(''); setLido(''); return; }
    const t = setInterval(() => setDica(d => (d + 1) % dicas.length), 3000);
    return () => clearInterval(t);
  }, [aberto]);

  const handleLeitura = useCallback((codigo: string) => {
    setLido(codigo);
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
    setTimeout(() => {
      onLeitura(codigo);
      onFechar();
      setLido('');
    }, 700);
  }, [onLeitura, onFechar]);

  useCameraBarcode({
    elementId: SCANNER_ID,
    ativo: aberto,
    onLeitura: handleLeitura,
    onErro: setErro,
  });

  if (!aberto) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem', flexShrink: 0, zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>📷</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#F5DEB3', fontWeight: 700 }}>
              Leitor de Código de Barras
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#A07850' }}>
              Aponte para o código EAN-13
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

      {/* Área do scanner */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* html5-qrcode renderiza o vídeo aqui */}
        <div
          id={SCANNER_ID}
          style={{
            width: '100%', height: '100%',
            // Remove estilos padrão do html5-qrcode
          }}
        />

        {/* Overlay de sucesso */}
        {lido && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,185,129,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}>
            <span style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>✅</span>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
              Código lido!
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', marginTop: '0.5rem', letterSpacing: '0.1em' }}>
              {lido}
            </div>
          </div>
        )}

        {/* Overlay de erro */}
        {erro && !lido && (
          <div style={{
            position: 'absolute', bottom: '10%', left: '5%', right: '5%',
            background: 'rgba(239,68,68,0.92)', borderRadius: '0.75rem',
            padding: '1rem', zIndex: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            color: '#fff', textAlign: 'center',
          }}>
            ⚠️ {erro}
            {erro.includes('HTTPS') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.85 }}>
                Acesse via https://padariasistemagestao.duckdns.org
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!lido && !erro && (
        <div style={{
          padding: '0.85rem 1.25rem', background: 'rgba(0,0,0,0.85)',
          textAlign: 'center', flexShrink: 0,
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#A07850' }}>
            💡 {dicas[dica]}
          </div>
          <div style={{ marginTop: '0.35rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#6B7280' }}>
            EAN-13 · EAN-8 · Code128 · QR Code · Balança
          </div>
        </div>
      )}

      {/* Remove estilos injetados pelo html5-qrcode */}
      <style>{`
        #${SCANNER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #${SCANNER_ID} img {
          display: none !important;
        }
        #${SCANNER_ID} > div:first-child {
          border: none !important;
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
}