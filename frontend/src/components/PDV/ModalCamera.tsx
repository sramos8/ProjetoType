import React, { useRef, useState, useCallback } from 'react';
import { useCameraBarcode } from '../../hooks/useCameraBarcode';
import { useResponsive } from '../../hooks/useResponsive';

interface Props {
  aberto: boolean;
  onLeitura: (codigo: string) => void;
  onFechar: () => void;
}

export function ModalCamera({ aberto, onLeitura, onFechar }: Props) {
  const { isMobile } = useResponsive();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState('');
  const [lido, setLido] = useState('');

  const handleLeitura = useCallback((codigo: string) => {
    setLido(codigo);
    setTimeout(() => {
      onLeitura(codigo);
      onFechar();
      setLido('');
    }, 600);
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
      background: 'rgba(0,0,0,0.92)',
      zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📷</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#F5DEB3', fontWeight: 700 }}>
              Leitor de Código de Barras
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#A07850' }}>
              Aponte a câmera para o código
            </div>
          </div>
        </div>
        <button onClick={onFechar} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '0.5rem', padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
          ✕ Fechar
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: '1rem', overflow: 'hidden', background: '#000' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', display: 'block', maxHeight: isMobile ? '60vh' : 400, objectFit: 'cover' }}
          muted
          playsInline
        />

        {/* Mira de leitura */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: '75%', height: 120 }}>
            {/* Cantos da mira */}
            {[
              { top: 0, left: 0, borderTop: '3px solid #C8822A', borderLeft: '3px solid #C8822A' },
              { top: 0, right: 0, borderTop: '3px solid #C8822A', borderRight: '3px solid #C8822A' },
              { bottom: 0, left: 0, borderBottom: '3px solid #C8822A', borderLeft: '3px solid #C8822A' },
              { bottom: 0, right: 0, borderBottom: '3px solid #C8822A', borderRight: '3px solid #C8822A' },
            ].map((estilo, i) => (
              <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...estilo }} />
            ))}

            {/* Linha de scan animada */}
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, #C8822A, transparent)',
              animation: 'scanLine 1.5s ease-in-out infinite',
              top: '50%',
            }} />

            {/* Área semitransparente */}
            <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(200,130,42,0.3)', background: 'rgba(200,130,42,0.05)' }} />
          </div>
        </div>

        {/* Feedback de leitura bem-sucedida */}
        {lido && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(16,185,129,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.15s ease',
          }}>
            <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</span>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>
              Código lido!
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem' }}>
              {lido}
            </div>
          </div>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div style={{ marginTop: '1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '0.5rem', padding: '0.65rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', maxWidth: 480, width: '90%', textAlign: 'center' }}>
          ⚠️ {erro}
          {erro.toLowerCase().includes('câmera') && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#C0392B' }}>
              Permita o acesso à câmera nas configurações do navegador
            </div>
          )}
        </div>
      )}

      {/* Dica */}
      {!lido && !erro && (
        <div style={{ marginTop: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#6B7280', textAlign: 'center', maxWidth: 380, padding: '0 1rem' }}>
          Compatível com EAN-13, EAN-8, QR Code, Code128, Code39 e outros
        </div>
      )}

      {/* Animação da linha de scan */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}