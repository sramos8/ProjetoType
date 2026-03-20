import React from 'react';
import type { AlertaProduto } from '../utils/validade';

interface Props {
  alerta: AlertaProduto;
  compact?: boolean; // versão mini para cards
}

export function AlertaBadge({ alerta, compact = false }: Props) {
  if (!alerta.temAlerta) return null;

  const badges: React.ReactNode[] = [];

  // ── Badge de validade ─────────────────────────────────────
  if (alerta.statusValidade === 'vencido') {
    badges.push(
      <span key="vencido" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        background: '#FEF2F2', color: '#B91C1C',
        border: '1px solid #FCA5A5', borderRadius: '999px',
        padding: compact ? '1px 6px' : '2px 8px',
        fontSize: compact ? '0.65rem' : '0.72rem',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>
        🚫 {compact ? 'Vencido' : 'VENCIDO'}
      </span>
    );
  } else if (alerta.statusValidade === 'vencendo') {
    const dias = alerta.diasParaVencer!;
    badges.push(
      <span key="vencendo" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        background: '#FFF7ED', color: '#C2410C',
        border: '1px solid #FED7AA', borderRadius: '999px',
        padding: compact ? '1px 6px' : '2px 8px',
        fontSize: compact ? '0.65rem' : '0.72rem',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>
        ⏰ {dias === 0 ? 'Vence hoje' : dias === 1 ? 'Vence amanhã' : `Vence em ${dias}d`}
      </span>
    );
  }

  // ── Badge de estoque ──────────────────────────────────────
  if (alerta.statusEstoque === 'zerado') {
    badges.push(
      <span key="zerado" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        background: '#F3F4F6', color: '#374151',
        border: '1px solid #D1D5DB', borderRadius: '999px',
        padding: compact ? '1px 6px' : '2px 8px',
        fontSize: compact ? '0.65rem' : '0.72rem',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>
        📦 Sem estoque
      </span>
    );
  } else if (alerta.statusEstoque === 'baixo') {
    badges.push(
      <span key="baixo" style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        background: '#FFFBEB', color: '#92400E',
        border: '1px solid #FDE68A', borderRadius: '999px',
        padding: compact ? '1px 6px' : '2px 8px',
        fontSize: compact ? '0.65rem' : '0.72rem',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>
        ⚠️ Estoque baixo
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
      {badges}
    </div>
  );
}