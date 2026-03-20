import React, { useState, useEffect } from 'react';
import type { Produto } from '../types';
import { produtoService } from '../services/api';
import { formatarValidade } from '../utils/validade';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  onEditarProduto?: (p: Produto) => void;
  refreshKey?: number;  // ← novo
}

export function PainelAlertas({ onEditarProduto, refreshKey = 0 }: Props) {
  const { isMobile } = useResponsive();
  const [dados, setDados] = useState<{
    vencendo: Produto[]; vencidos: Produto[];
    estoquesBaixos: Produto[]; semEstoque: Produto[];
    totalAlertas: number;
  } | null>(null);
  const [aberto, setAberto]   = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'validade' | 'estoque'>('validade');

  useEffect(() => {
    produtoService.alertas().then(setDados).catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    produtoService.alertas().then(setDados).catch(() => {});
    // Atualiza a cada 5 minutos
    const t = setInterval(() => produtoService.alertas().then(setDados).catch(() => {}), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  if (!dados || dados.totalAlertas === 0) return null;

  const totalValidade = dados.vencidos.length + dados.vencendo.length;
  const totalEstoque  = dados.semEstoque.length + dados.estoquesBaixos.length;

  return (
    <>
      {/* ── Botão flutuante de alertas ── */}
      <button
        onClick={() => setAberto(v => !v)}
        style={{
          position: 'fixed', top: isMobile ? 'auto' : 80, bottom: isMobile ? '5rem' : 'auto',
          right: '1rem', zIndex: 90,
          background: '#DC2626', color: '#fff',
          border: 'none', borderRadius: '999px',
          padding: '0.5rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 700,
          animation: 'pulse 2s infinite',
        }}
      >
        🔔 {dados.totalAlertas} alerta{dados.totalAlertas !== 1 ? 's' : ''}
      </button>

      {/* ── Painel de alertas ── */}
      {aberto && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setAberto(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 91 }}
          />

          <div style={{
            position: 'fixed',
            top: isMobile ? 'auto' : 80, bottom: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : '1rem', left: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : 380,
            maxHeight: isMobile ? '80vh' : '70vh',
            background: '#FFFBF5', borderRadius: isMobile ? '1rem 1rem 0 0' : '1rem',
            border: '1px solid #E8D5B0', boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            zIndex: 92, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>

            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', background: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                🔔 Alertas do Sistema
              </div>
              <button onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Abas */}
            <div style={{ display: 'flex', borderBottom: '1px solid #F0E4CC', flexShrink: 0 }}>
              {[
                { id: 'validade', label: `⏰ Validade`, count: totalValidade },
                { id: 'estoque',  label: `📦 Estoque`,  count: totalEstoque  },
              ].map(a => (
                <button key={a.id} onClick={() => setAbaAtiva(a.id as any)} style={{
                  flex: 1, padding: '0.75rem',
                  background: abaAtiva === a.id ? '#FFF7ED' : 'transparent',
                  border: 'none', borderBottom: abaAtiva === a.id ? '2px solid #C8822A' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.85rem', fontWeight: abaAtiva === a.id ? 700 : 500,
                  color: abaAtiva === a.id ? '#C8822A' : '#7A5C4E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}>
                  {a.label}
                  {a.count > 0 && (
                    <span style={{ background: '#DC2626', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {a.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem' }}>

              {abaAtiva === 'validade' && (
                <>
                  {dados.vencidos.length > 0 && (
                    <>
                      <div style={tituloSecao}>🚫 Vencidos ({dados.vencidos.length})</div>
                      {dados.vencidos.map(p => (
                        <ItemAlerta key={p.id} produto={p} tipo="vencido" onEditar={onEditarProduto} />
                      ))}
                    </>
                  )}
                  {dados.vencendo.length > 0 && (
                    <>
                      <div style={{ ...tituloSecao, marginTop: dados.vencidos.length > 0 ? '0.75rem' : 0 }}>⏰ Vencendo em breve ({dados.vencendo.length})</div>
                      {dados.vencendo.map(p => (
                        <ItemAlerta key={p.id} produto={p} tipo="vencendo" onEditar={onEditarProduto} />
                      ))}
                    </>
                  )}
                  {totalValidade === 0 && <p style={semAlertas}>✅ Nenhum produto vencendo</p>}
                </>
              )}

              {abaAtiva === 'estoque' && (
                <>
                  {dados.semEstoque.length > 0 && (
                    <>
                      <div style={tituloSecao}>📦 Sem estoque ({dados.semEstoque.length})</div>
                      {dados.semEstoque.map(p => (
                        <ItemAlerta key={p.id} produto={p} tipo="zerado" onEditar={onEditarProduto} />
                      ))}
                    </>
                  )}
                  {dados.estoquesBaixos.length > 0 && (
                    <>
                      <div style={{ ...tituloSecao, marginTop: dados.semEstoque.length > 0 ? '0.75rem' : 0 }}>⚠️ Estoque baixo ({dados.estoquesBaixos.length})</div>
                      {dados.estoquesBaixos.map(p => (
                        <ItemAlerta key={p.id} produto={p} tipo="baixo" onEditar={onEditarProduto} />
                      ))}
                    </>
                  )}
                  {totalEstoque === 0 && <p style={semAlertas}>✅ Estoque em dia</p>}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(220,38,38,0.4); }
          50%       { box-shadow: 0 4px 32px rgba(220,38,38,0.7); }
        }
      `}</style>
    </>
  );
}

// ── Item individual de alerta ─────────────────────────────────
function ItemAlerta({ produto, tipo, onEditar }: {
  produto: Produto;
  tipo: 'vencido' | 'vencendo' | 'zerado' | 'baixo';
  onEditar?: (p: Produto) => void;
}) {
  const cores = {
    vencido:  { bg: '#FEF2F2', border: '#FCA5A5', cor: '#B91C1C' },
    vencendo: { bg: '#FFF7ED', border: '#FED7AA', cor: '#C2410C' },
    zerado:   { bg: '#F9FAFB', border: '#D1D5DB', cor: '#374151' },
    baixo:    { bg: '#FFFBEB', border: '#FDE68A', cor: '#92400E' },
  }[tipo];

  return (
    <div style={{
      background: cores.bg, border: `1px solid ${cores.border}`,
      borderRadius: '0.6rem', padding: '0.65rem 0.85rem',
      marginBottom: '0.4rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#2C1A0E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {produto.nome}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: cores.cor, marginTop: '0.15rem', fontWeight: 600 }}>
          {tipo === 'vencido'  && `🚫 Venceu em ${formatarValidade(produto.dataValidade)}`}
          {tipo === 'vencendo' && `⏰ Vence em ${formatarValidade(produto.dataValidade)}`}
          {tipo === 'zerado'   && `📦 Sem estoque`}
          {tipo === 'baixo'    && `⚠️ Restam apenas ${produto.estoque} un. (mín: ${produto.estoqueMinimo})`}
        </div>
      </div>
      {onEditar && (
        <button onClick={() => onEditar(produto)} style={{
          marginLeft: '0.5rem', padding: '0.25rem 0.65rem',
          background: 'rgba(255,255,255,0.8)', border: `1px solid ${cores.border}`,
          borderRadius: '0.4rem', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: cores.cor, fontWeight: 600, flexShrink: 0,
        }}>
          Editar
        </button>
      )}
    </div>
  );
}

const tituloSecao: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700,
  color: '#7A5C4E', textTransform: 'uppercase', letterSpacing: '0.06em',
  marginBottom: '0.4rem',
};
const semAlertas: React.CSSProperties = {
  textAlign: 'center', padding: '1.5rem', color: '#8B6F5E',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', margin: 0,
};