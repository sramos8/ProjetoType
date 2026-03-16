import React from 'react';
import type { Venda } from '../../types/venda';

interface Props {
  venda: Venda;
  onRemover: (itemId: string) => void;
  onAlterarQtd: (itemId: string, qtd: number) => void;
  onConcluir: () => void;
  onCancelar: () => void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Carrinho({ venda, onRemover, onAlterarQtd, onConcluir, onCancelar }: Props) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.titulo}>🛒 Carrinho</span>
        <span style={s.badge}>{venda.itens.length} iten{venda.itens.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={s.itens}>
        {venda.itens.length === 0 ? (
          <div style={s.vazio}>Nenhum produto adicionado</div>
        ) : venda.itens.map(item => (
          <div key={item.id} style={s.item}>
            <div style={s.itemNome}>{item.nomeProduto}</div>
            <div style={s.itemControls}>
              <button style={s.btnQtd} onClick={() => onAlterarQtd(item.id, item.quantidade - 1)}>−</button>
              <span style={s.qtd}>{item.quantidade}</span>
              <button style={s.btnQtd} onClick={() => onAlterarQtd(item.id, item.quantidade + 1)}>+</button>
              <span style={s.subtotal}>{fmt(item.subtotal)}</span>
              <button style={s.btnRemover} onClick={() => onRemover(item.id)}>✕</button>
            </div>
            <div style={s.itemUni}>{fmt(item.precoUnitario)} / un.</div>
          </div>
        ))}
      </div>

      <div style={s.total}>
        <span style={s.totalLabel}>TOTAL</span>
        <span style={s.totalValor}>{fmt(venda.valorTotal)}</span>
      </div>

      <div style={s.acoes}>
        <button style={s.btnCancelar} onClick={onCancelar} disabled={venda.itens.length === 0}>
          🗑 Cancelar
        </button>
        <button style={s.btnConcluir} onClick={onConcluir} disabled={venda.itens.length === 0}>
          ✓ Finalizar Venda
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '1rem', overflow: 'hidden' },
  header: { padding: '1rem 1.25rem', borderBottom: '1px solid #F0E4CC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2C1A0E' },
  titulo: { fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#F5DEB3', fontWeight: 700 },
  badge: { background: '#C8822A', color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 },
  itens: { flex: 1, overflowY: 'auto', padding: '0.75rem' },
  vazio: { textAlign: 'center', padding: '2rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' },
  item: { padding: '0.65rem 0.75rem', marginBottom: '0.5rem', background: '#FFF8EE', border: '1px solid #F0E4CC', borderRadius: '0.5rem' },
  itemNome: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: '#2C1A0E', marginBottom: '0.35rem' },
  itemUni: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#A07850', marginTop: '0.2rem' },
  itemControls: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  btnQtd: { width: 24, height: 24, border: '1px solid #E0C9A8', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C3D2E', fontWeight: 700 },
  qtd: { minWidth: 28, textAlign: 'center', fontWeight: 700, color: '#2C1A0E', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' },
  subtotal: { flex: 1, textAlign: 'right', fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#C8822A', fontWeight: 700 },
  btnRemover: { background: '#FEE2E2', border: 'none', borderRadius: '4px', color: '#B91C1C', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem' },
  total: { padding: '1rem 1.25rem', borderTop: '2px solid #E8D5B0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDF6EC' },
  totalLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: '#7A5C4E', letterSpacing: '0.1em' },
  totalValor: { fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E', fontWeight: 700 },
  acoes: { padding: '0.75rem 1rem', display: 'flex', gap: '0.6rem', borderTop: '1px solid #F0E4CC' },
  btnCancelar: { flex: 1, padding: '0.65rem', background: 'transparent', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#8B6F5E', fontWeight: 600 },
  btnConcluir: { flex: 2, padding: '0.65rem', background: '#C8822A', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#fff', fontWeight: 700 },
};