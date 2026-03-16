import React, { useEffect } from 'react';

interface ModalProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: React.ReactNode;
}

export function Modal({ aberto, titulo, onFechar, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onFechar]);

  if (!aberto) return null;

  return (
    <div style={styles.overlay} onClick={onFechar}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.titulo}>{titulo}</h2>
          <button style={styles.fechar} onClick={onFechar}>✕</button>
        </div>
        <div style={styles.corpo}>{children}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,10,5,0.75)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: '#FFFBF5', borderRadius: '1rem', width: '100%', maxWidth: 520,
    boxShadow: '0 24px 80px rgba(0,0,0,0.25)', border: '1px solid #E8D5B0',
    animation: 'slideUp 0.2s ease',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #F0E4CC',
  },
  titulo: { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#2C1A0E' },
  fechar: {
    background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer',
    color: '#8B6F5E', padding: '4px 8px', borderRadius: '6px',
    transition: 'background 0.15s',
  },
  corpo: { padding: '1.5rem' },
};