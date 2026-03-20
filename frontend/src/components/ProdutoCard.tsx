import React from 'react';
import type { Produto } from '../types';
import { CATEGORIAS } from '../types';
import { verificarAlertas, formatarValidade } from '../utils/validade';
import { AlertaBadge } from './AlertaBadge';

interface ProdutoCardProps {
  produto: Produto;
  onEditar: (p: Produto) => void;
  onDeletar: (id: string) => void;
  onToggleDisponivel: (p: Produto) => void;
}

export function ProdutoCard({ produto, onEditar, onDeletar, onToggleDisponivel }: ProdutoCardProps) {
  const cat = CATEGORIAS.find(c => c.valor === produto.categoria);
  const precoFmt = produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const alerta = verificarAlertas(produto);

  return (
    <div style={{ ...styles.card, opacity: produto.disponivel ? 1 : 0.65 }}>
      <div style={styles.header}>
        <span style={styles.emoji}>{cat?.emoji ?? '🛒'}</span>
        <span style={{ ...styles.badge, background: produto.disponivel ? '#D4EDDA' : '#F8D7DA', color: produto.disponivel ? '#155724' : '#721C24' }}>
          {produto.disponivel ? 'Disponível' : 'Indisponível'}
        </span>
      </div>

      <h3 style={styles.nome}>{produto.nome}</h3>
      <AlertaBadge alerta={alerta} />
      {produto.dataValidade && (
        <div style={{
          fontSize: '0.72rem', color: alerta.statusValidade === 'vencido' ? '#B91C1C'
            : alerta.statusValidade === 'vencendo' ? '#C2410C' : '#8B6F5E',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          📅 Val: {formatarValidade(produto.dataValidade)}
        </div>
      )}
      <p style={styles.descricao}>{produto.descricao || '—'}</p>

      <div style={styles.meta}>
        <span style={styles.cat}>{cat?.label}</span>
        <span style={styles.preco}>{precoFmt}</span>
      </div>

      <div style={styles.estoque}>
        <span style={styles.estoqueLabel}>Estoque</span>
        <span style={{ ...styles.estoqueVal, color: produto.estoque < 10 ? '#C0392B' : '#155724' }}>
          {produto.estoque} un.
        </span>
      </div>

      <div style={styles.acoes}>
        <button style={styles.btnToggle} onClick={() => onToggleDisponivel(produto)}
          title={produto.disponivel ? 'Desativar' : 'Ativar'}>
          {produto.disponivel ? '⏸' : '▶'}
        </button>
        <button style={styles.btnEditar} onClick={() => onEditar(produto)}>Editar</button>
        <button style={styles.btnDeletar} onClick={() => onDeletar(produto.id)}>Remover</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.875rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default', boxShadow: '0 2px 8px rgba(100,60,20,0.07)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  emoji: { fontSize: '2rem', lineHeight: 1 },
  badge: { fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.03em' },
  nome: { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', color: '#2C1A0E', lineHeight: 1.25 },
  descricao: { margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#8B6F5E', lineHeight: 1.5, flexGrow: 1 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid #F0E4CC' },
  cat: { fontSize: '0.75rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  preco: { fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: '#C8822A', fontWeight: 700 },
  estoque: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif" },
  estoqueLabel: { color: '#8B6F5E' },
  estoqueVal: { fontWeight: 700 },
  acoes: { display: 'flex', gap: '0.5rem', paddingTop: '0.4rem' },
  btnToggle: { padding: '0.4rem 0.6rem', background: '#FFF3E0', border: '1px solid #E0C9A8', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' },
  btnEditar: { flex: 1, padding: '0.45rem', background: '#EBF5FB', border: '1px solid #AED6F1', borderRadius: '0.4rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#1A5276', fontWeight: 600 },
  btnDeletar: { flex: 1, padding: '0.45rem', background: '#FDEDEC', border: '1px solid #F1948A', borderRadius: '0.4rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#922B21', fontWeight: 600 },
};