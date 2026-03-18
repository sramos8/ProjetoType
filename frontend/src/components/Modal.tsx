import React, { useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';

interface ModalProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}

export function Modal({ aberto, titulo, onFechar, children }: ModalProps) {
  const { isMobile } = useResponsive();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onFechar]);

  // Bloquear scroll do body quando modal aberto
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,10,5,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '1rem',
      }}
      onClick={onFechar}
    >
      <div
        style={{
          background: '#FFFBF5',
          // Mobile: drawer de baixo; Desktop: modal centralizado
          borderRadius: isMobile ? '1.25rem 1.25rem 0 0' : '1rem',
          width: '100%',
          maxWidth: isMobile ? '100%' : 520,
          // Mobile: altura máxima com scroll; Desktop: auto
          maxHeight: isMobile ? '92vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMobile
            ? '0 -8px 40px rgba(0,0,0,0.25)'
            : '0 24px 80px rgba(0,0,0,0.25)',
          border: '1px solid #E8D5B0',
          animation: isMobile ? 'slideUpMobile 0.25s ease' : 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle visual no mobile */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem 0 0.25rem', flexShrink: 0 }}>
            <div style={{ width: 40, height: 4, background: '#E0C9A8', borderRadius: '999px' }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0.75rem 1.25rem 0.75rem' : '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid #F0E4CC',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? '1.2rem' : '1.4rem',
            color: '#2C1A0E',
          }}>
            {titulo}
          </h2>
          <button
            onClick={onFechar}
            style={{
              background: 'none', border: 'none',
              fontSize: '1.1rem', cursor: 'pointer',
              color: '#8B6F5E', padding: '4px 8px',
              borderRadius: '6px', transition: 'background 0.15s',
            }}
          >
            ✕
          </button>
        </div>

        {/* Corpo — com scroll interno */}
        <div style={{
          padding: isMobile ? '1.25rem 1.25rem 2rem' : '1.5rem',
          overflowY: 'auto',
          flex: 1,
          // Padding extra no mobile para não colicar com gestos do sistema
          paddingBottom: isMobile ? 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' : '1.5rem',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}