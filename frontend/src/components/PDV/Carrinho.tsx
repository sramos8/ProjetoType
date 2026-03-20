import React, { useState } from 'react';
import type { Venda, ItemVenda } from '../../types/venda';

interface Props {
  venda: Venda;
  onRemover: (itemId: string) => void;
  onAlterarQtd: (itemId: string, qtd: number) => void;
  onAlterarPreco: (itemId: string, novoPreco: number) => void;
  onConcluir: () => void;
  onCancelar: () => void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Carrinho({ venda, onRemover, onAlterarQtd, onAlterarPreco, onConcluir, onCancelar }: Props) {
  // Controla qual item está com edição de preço aberta
  const [editandoPreco, setEditandoPreco] = useState<string | null>(null);
  const [precoTemp, setPrecoTemp]         = useState('');

  const abrirEdicaoPreco = (item: ItemVenda) => {
    setEditandoPreco(item.id);
    setPrecoTemp(item.precoUnitario.toFixed(2));
  };

  const confirmarPreco = (itemId: string) => {
    const valor = parseFloat(precoTemp.replace(',', '.'));
    if (!isNaN(valor) && valor >= 0) {
      onAlterarPreco(itemId, valor);
    }
    setEditandoPreco(null);
    setPrecoTemp('');
  };

  const cancelarEdicaoPreco = () => {
    setEditandoPreco(null);
    setPrecoTemp('');
  };

  return (
    <div style={s.wrap}>

      {/* Header */}
      <div style={s.header}>
        <span style={s.titulo}>🛒 Carrinho</span>
        <span style={s.badge}>
          {venda.itens.length} iten{venda.itens.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Itens */}
      <div style={s.itens}>
        {venda.itens.length === 0 ? (
          <div style={s.vazio}>Nenhum produto adicionado</div>
        ) : venda.itens.map(item => (
          <div key={item.id} style={s.item}>

            {/* Nome + remover */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <div style={s.itemNome}>{item.nomeProduto}</div>
              <button style={s.btnRemover} onClick={() => onRemover(item.id)}>✕</button>
            </div>

            {/* Controles de quantidade */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <span style={s.miniLabel}>Qtd:</span>
              <button style={s.btnQtd} onClick={() => onAlterarQtd(item.id, item.quantidade - 1)}>−</button>
              <span style={s.qtd}>{item.quantidade}</span>
              <button style={s.btnQtd} onClick={() => onAlterarQtd(item.id, item.quantidade + 1)}>+</button>
            </div>

            {/* Preço unitário — editável */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={s.miniLabel}>Preço/un:</span>

              {editandoPreco === item.id ? (
                // Campo de edição de preço
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#8B6F5E' }}>R$</span>
                  <input
                    style={s.inputPreco}
                    type="number"
                    step="0.01"
                    min="0"
                    value={precoTemp}
                    onChange={e => setPrecoTemp(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') confirmarPreco(item.id);
                      if (e.key === 'Escape') cancelarEdicaoPreco();
                    }}
                    autoFocus
                  />
                  <button style={s.btnConfirmar} onClick={() => confirmarPreco(item.id)} title="Confirmar">✓</button>
                  <button style={s.btnCancelarPreco} onClick={cancelarEdicaoPreco} title="Cancelar">✕</button>
                </div>
              ) : (
                // Exibição do preço com botão editar
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                  <span style={s.precoUni}>{fmt(item.precoUnitario)}</span>
                  <button
                    style={s.btnEditarPreco}
                    onClick={() => abrirEdicaoPreco(item)}
                    title="Editar preço (venda por peso)"
                  >
                    ✏️
                  </button>
                  {item.precoUnitario !== item.precoUnitario && (
                    <span style={s.tagAlterado}>alterado</span>
                  )}
                </div>
              )}

              {/* Subtotal sempre visível */}
              <span style={s.subtotal}>{fmt(item.subtotal)}</span>
            </div>

            {/* Indicador de preço alterado */}
            {item.precoOriginal != null && item.precoOriginal !== item.precoUnitario && (
              <div style={s.precoAlteradoInfo}>
                💡 Preço original: {fmt(item.precoOriginal)} · Alterado para: {fmt(item.precoUnitario)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={s.total}>
        <span style={s.totalLabel}>TOTAL</span>
        <span style={s.totalValor}>{fmt(venda.valorTotal)}</span>
      </div>

      {/* Ações */}
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
  wrap:             { display: 'flex', flexDirection: 'column', height: '100%', background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '1rem', overflow: 'hidden' },
  header:           { padding: '1rem 1.25rem', borderBottom: '1px solid #F0E4CC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2C1A0E', flexShrink: 0 },
  titulo:           { fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#F5DEB3', fontWeight: 700 },
  badge:            { background: '#C8822A', color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 },
  itens:            { flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  vazio:            { textAlign: 'center', padding: '2rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' },
  item:             { padding: '0.75rem', background: '#FFF8EE', border: '1px solid #F0E4CC', borderRadius: '0.6rem' },
  itemNome:         { fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#2C1A0E', lineHeight: 1.2, flex: 1, marginRight: '0.5rem' },
  miniLabel:        { fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#A07850', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 48, flexShrink: 0 },
  btnQtd:           { width: 26, height: 26, border: '1px solid #E0C9A8', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C3D2E', fontWeight: 700, flexShrink: 0 },
  qtd:              { minWidth: 28, textAlign: 'center', fontWeight: 700, color: '#2C1A0E', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' },
  precoUni:         { fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#8B6F5E' },
  subtotal:         { fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', color: '#C8822A', fontWeight: 700, marginLeft: 'auto' },
  btnRemover:       { background: '#FEE2E2', border: 'none', borderRadius: '4px', color: '#B91C1C', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem', flexShrink: 0 },
  btnEditarPreco:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: '1px 4px', opacity: 0.7, flexShrink: 0 },
  inputPreco:       { width: 80, padding: '0.2rem 0.4rem', border: '1.5px solid #C8822A', borderRadius: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', color: '#2C1A0E', background: '#FFFDF8', outline: 'none', flexShrink: 0 },
  btnConfirmar:     { background: '#10B981', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 },
  btnCancelarPreco: { background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '4px', color: '#6B7280', cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem', flexShrink: 0 },
  tagAlterado:      { fontSize: '0.65rem', background: '#FFF3E0', color: '#C8822A', border: '1px solid #FED7AA', borderRadius: '999px', padding: '1px 6px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 },
  precoAlteradoInfo:{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' },
  total:            { padding: '0.85rem 1.25rem', borderTop: '2px solid #E8D5B0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDF6EC', flexShrink: 0 },
  totalLabel:       { fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: '#7A5C4E', letterSpacing: '0.1em' },
  totalValor:       { fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E', fontWeight: 700 },
  acoes:            { padding: '0.75rem 1rem', display: 'flex', gap: '0.6rem', borderTop: '1px solid #F0E4CC', flexShrink: 0 },
  btnCancelar:      { flex: 1, padding: '0.65rem', background: 'transparent', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#8B6F5E', fontWeight: 600 },
  btnConcluir:      { flex: 2, padding: '0.65rem', background: '#C8822A', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', color: '#fff', fontWeight: 700 },
};