import { useState, useEffect } from 'react';
import type { Relatorio as RelatorioType } from '../types/venda';
import { vendaService } from '../services/vendaService';
import { FORMAS_PAGAMENTO } from '../types/venda';
import { useResponsive } from '../hooks/useResponsive';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Relatorio() {
  const [dados, setDados] = useState<RelatorioType | null>(null);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'resumo' | 'produtos' | 'operadores' | 'detalhe'>('resumo');

  const { isMobile } = useResponsive();

  useEffect(() => {
    setCarregando(true);
    vendaService.relatorio(dataInicio, dataFim)
      .then(setDados)
      .finally(() => setCarregando(false));
  }, [dataInicio, dataFim]);

  if (carregando || !dados) return (
    <div style={{ padding: '2rem', color: '#8B6F5E', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      Carregando relatório...
    </div>
  );

  const maxDia = Math.max(...dados.vendasPorDia.map(d => d.total), 1);

  return (
    <div style={{ ...s.page, padding: isMobile ? '1rem' : '1.5rem 2rem' }}>

      {/* Header */}
      <div style={{
        ...s.header,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
      }}>
        <h2 style={{ ...s.titulo, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>
          📊 Relatório de Faturamento
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            style={{ ...s.dateInput, maxWidth: isMobile ? 135 : 'auto', fontSize: isMobile ? '0.78rem' : '0.88rem' }} />
          <span style={{ color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' }}>até</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ ...s.dateInput, maxWidth: isMobile ? 135 : 'auto', fontSize: isMobile ? '0.78rem' : '0.88rem' }} />
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
        gap: isMobile ? '0.65rem' : '0.85rem',
        marginBottom: '1.25rem',
      }}>
        {[
          { label: 'Faturamento',  valor: fmt(dados.resumo.faturamentoBruto), emoji: '💰', cor: '#C8822A' },
          { label: 'Vendas',       valor: dados.resumo.totalVendas,            emoji: '🧾', cor: '#0EA5E9' },
          { label: 'Ticket Médio', valor: fmt(dados.resumo.ticketMedio),        emoji: '📈', cor: '#7C3AED' },
          { label: 'Canceladas',   valor: dados.resumo.canceladas,              emoji: '❌', cor: '#DC2626' },
        ].map(card => (
          <div key={card.label} style={{ ...s.statCard, padding: isMobile ? '0.85rem 0.65rem' : '1.1rem' }}>
            <div style={{ ...s.statEmoji, fontSize: isMobile ? '1.4rem' : '1.75rem' }}>{card.emoji}</div>
            <div style={{ ...s.statValor, fontSize: isMobile ? '1rem' : '1.4rem', color: card.cor }}>{card.valor}</div>
            <div style={{ ...s.statLabel, fontSize: isMobile ? '0.6rem' : '0.72rem' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div style={{ ...s.abas, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'resumo',     label: isMobile ? '📊' : '📊 Resumo'     },
          { id: 'produtos',   label: isMobile ? '🏆' : '🏆 Produtos'   },
          { id: 'operadores', label: isMobile ? '👷' : '👷 Operadores' },
          { id: 'detalhe',    label: isMobile ? '🔍' : '🔍 Detalhe'    },
        ].map(a => (
          <button
            key={a.id}
            onClick={() => setAbaAtiva(a.id as typeof abaAtiva)}
            style={{
              ...s.abaBtn,
              ...(abaAtiva === a.id ? s.abaAtiva : {}),
              flexShrink: 0,
              fontSize: isMobile ? '1rem' : '0.85rem',
              padding: isMobile ? '0.5rem 0.9rem' : '0.5rem 1.1rem',
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── Aba Resumo ── */}
      {abaAtiva === 'resumo' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          {/* Forma de pagamento */}
          <div style={s.secao}>
            <h3 style={s.secaoTitulo}>💳 Por Forma de Pagamento</h3>
            {dados.porFormaPagamento.length === 0
              ? <p style={s.vazio}>Sem dados</p>
              : dados.porFormaPagamento.map(fp => {
                  const info = FORMAS_PAGAMENTO.find(f => f.valor === fp.formaPagamento);
                  const pct  = dados.resumo.faturamentoBruto > 0
                    ? (fp.total / dados.resumo.faturamentoBruto) * 100 : 0;
                  return (
                    <div key={fp.formaPagamento} style={s.fpItem}>
                      <span style={{ ...s.fpLabel, width: isMobile ? 70 : 90, fontSize: isMobile ? '0.75rem' : '0.82rem' }}>
                        {info?.emoji} {info?.label ?? fp.formaPagamento}
                      </span>
                      <div style={s.fpBar}>
                        <div style={{ ...s.fpBarFill, width: `${pct}%` }} />
                      </div>
                      <span style={{ ...s.fpValor, fontSize: isMobile ? '0.8rem' : '0.9rem' }}>{fmt(fp.total)}</span>
                      <span style={s.fpQtd}>({fp.qtd}x)</span>
                    </div>
                  );
                })}
          </div>

          {/* Gráfico por dia */}
          <div style={s.secao}>
            <h3 style={s.secaoTitulo}>📅 Faturamento por Dia</h3>
            {dados.vendasPorDia.length === 0
              ? <p style={s.vazio}>Sem dados no período</p>
              : (
                <div style={{ ...s.grafico, height: isMobile ? 160 : 200 }}>
                  {[...dados.vendasPorDia].reverse().map(d => (
                    <div key={d.dia} style={{ ...s.barra, minWidth: isMobile ? 36 : 48 }}>
                      <span style={s.barraValor}>{fmt(d.total)}</span>
                      <div style={{ ...s.barraFill, height: `${(d.total / maxDia) * (isMobile ? 100 : 140)}px`, width: isMobile ? 24 : 32 }} title={fmt(d.total)} />
                      <span style={s.barraDia}>{d.dia.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {/* ── Aba Produtos ── */}
      {abaAtiva === 'produtos' && (
        <div style={s.secao}>
          <h3 style={s.secaoTitulo}>🏆 Produtos Mais Vendidos</h3>
          {dados.produtosMaisVendidos.length === 0
            ? <p style={s.vazio}>Sem dados no período</p>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...s.tabela, minWidth: isMobile ? 320 : 'auto' }}>
                  <thead>
                    <tr style={{ background: '#F5EDD8' }}>
                      <th style={s.th}>#</th>
                      <th style={s.th}>Produto</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Qtd</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.produtosMaisVendidos.map((p, i) => (
                      <tr key={p.produtoId} style={{ borderBottom: '1px solid #F0E4CC', background: i % 2 === 0 ? '#FFFBF5' : '#fff' }}>
                        <td style={{ ...s.td, fontWeight: 700, color: '#C8822A', width: 40 }}>#{i + 1}</td>
                        <td style={{ ...s.td, fontWeight: 600, color: '#2C1A0E' }}>{p.nomeProduto}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={{ background: '#EFF6FF', color: '#0EA5E9', borderRadius: '999px', padding: '2px 10px', fontWeight: 700, fontSize: '0.82rem' }}>
                            {p.totalQtd} un.
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A' }}>{fmt(p.totalValor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {/* ── Aba Operadores ── */}
      {abaAtiva === 'operadores' && (
        <div style={s.secao}>
          <h3 style={s.secaoTitulo}>👷 Vendas por Operador</h3>
          {dados.porOperador.length === 0
            ? <p style={s.vazio}>Sem dados no período</p>
            : isMobile
              ? (
                // Mobile — cards em vez de tabela
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dados.porOperador.map((op, i) => (
                    <div key={op.operador + i} style={{ background: '#FDF6EC', border: '1px solid #F0E4CC', borderRadius: '0.65rem', padding: '0.9rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#2C1A0E', fontSize: '0.9rem' }}>
                          👷 {op.operador}
                        </span>
                        <span style={{ background: '#F5F3FF', color: '#7C3AED', borderRadius: '999px', padding: '2px 10px', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" }}>
                          {op.totalVendas}x
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Faturado</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#C8822A', fontWeight: 700 }}>{fmt(op.totalFaturado)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.65rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Ticket Médio</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#374151', fontWeight: 700 }}>
                            {fmt(op.totalVendas > 0 ? op.totalFaturado / op.totalVendas : 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
              : (
                // Desktop — tabela original
                <table style={s.tabela}>
                  <thead>
                    <tr style={{ background: '#F5EDD8' }}>
                      <th style={s.th}>Operador</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Nº Vendas</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Total Faturado</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.porOperador.map((op, i) => (
                      <tr key={op.operador} style={{ borderBottom: '1px solid #F0E4CC', background: i % 2 === 0 ? '#FFFBF5' : '#fff' }}>
                        <td style={{ ...s.td, fontWeight: 600, color: '#2C1A0E' }}>👷 {op.operador}</td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <span style={{ background: '#F5F3FF', color: '#7C3AED', borderRadius: '999px', padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem' }}>
                            {op.totalVendas}x
                          </span>
                        </td>
                        <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A' }}>{fmt(op.totalFaturado)}</td>
                        <td style={{ ...s.td, textAlign: 'right', color: '#6B7280' }}>
                          {fmt(op.totalVendas > 0 ? op.totalFaturado / op.totalVendas : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          }
        </div>
      )}

      {/* ── Aba Detalhe ── */}
      {abaAtiva === 'detalhe' && (
        <div style={s.secao}>
          <h3 style={s.secaoTitulo}>🔍 Detalhe por Venda</h3>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#A07850', marginBottom: '1rem' }}>
            Mostrando até 200 registros mais recentes
          </p>
          {dados.detalheVendas.length === 0
            ? <p style={s.vazio}>Sem dados no período</p>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...s.tabela, minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#F5EDD8' }}>
                      <th style={s.th}>Data</th>
                      <th style={s.th}>Operador</th>
                      <th style={s.th}>Produto</th>
                      <th style={{ ...s.th, textAlign: 'center' }}>Qtd</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Unit.</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Subtotal</th>
                      <th style={s.th}>Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.detalheVendas.map((d, i) => {
                      const fp = FORMAS_PAGAMENTO.find(f => f.valor === d.formaPagamento);
                      return (
                        <tr
                          key={`${d.vendaId}-${d.nomeProduto}-${i}`}
                          style={{ borderBottom: '1px solid #F0E4CC', background: i % 2 === 0 ? '#FFFBF5' : '#fff' }}
                        >
                          <td style={{ ...s.td, fontSize: '0.78rem', color: '#A07850' }}>{d.dataVenda}</td>
                          <td style={{ ...s.td, fontWeight: 600, color: '#2C1A0E' }}>
                            <span style={{ background: '#ECFDF5', color: '#065F46', borderRadius: '999px', padding: '2px 8px', fontSize: '0.78rem' }}>
                              👷 {d.operador}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontWeight: 500 }}>{d.nomeProduto}</td>
                          <td style={{ ...s.td, textAlign: 'center', fontWeight: 700, color: '#0EA5E9' }}>{d.quantidade}</td>
                          <td style={{ ...s.td, textAlign: 'right', color: '#6B7280' }}>{fmt(d.precoUnitario)}</td>
                          <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A' }}>{fmt(d.subtotal)}</td>
                          <td style={{ ...s.td, fontSize: '0.8rem' }}>{fp?.emoji} {fp?.label ?? d.formaPagamento}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '1.5rem 2rem', background: '#FDF6EC', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  titulo:      { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E' },
  dateInput:   { padding: '0.4rem 0.75rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', background: '#FFFBF5' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' },
  statCard:    { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', padding: '1.1rem', textAlign: 'center' },
  statEmoji:   { fontSize: '1.75rem', marginBottom: '0.4rem' },
  statValor:   { fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' },
  statLabel:   { fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#8B6F5E', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
  abas:        { display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  abaBtn:      { padding: '0.5rem 1.1rem', border: '1.5px solid #E0C9A8', borderRadius: '999px', cursor: 'pointer', background: '#FFFBF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#7A5C4E', fontWeight: 500 },
  abaAtiva:    { background: '#2C1A0E', color: '#F5DEB3', borderColor: '#2C1A0E', fontWeight: 700 },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  secao:       { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' },
  secaoTitulo: { margin: '0 0 1rem', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C1A0E' },
  vazio:       { color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', margin: 0 },
  fpItem:      { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' },
  fpLabel:     { width: 90, fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#374151', flexShrink: 0 },
  fpBar:       { flex: 1, height: 10, background: '#F0E4CC', borderRadius: '999px', overflow: 'hidden' },
  fpBarFill:   { height: '100%', background: 'linear-gradient(90deg, #C8822A, #F59E0B)', borderRadius: '999px', transition: 'width 0.4s ease' },
  fpValor:     { fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', color: '#C8822A', fontWeight: 700, flexShrink: 0 },
  fpQtd:       { fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#A07850', flexShrink: 0 },
  grafico:     { display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: 200, overflowX: 'auto', paddingBottom: '0.5rem' },
  barra:       { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: 48 },
  barraValor:  { fontSize: '0.6rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', lineHeight: 1.1 },
  barraFill:   { width: 32, background: 'linear-gradient(180deg, #C8822A, #F59E0B)', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.3s ease' },
  barraDia:    { fontSize: '0.65rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif" },
  tabela:      { width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" },
  th:          { padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: '#7A5C4E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', background: '#F5EDD8' },
  td:          { padding: '0.55rem 0.75rem', fontSize: '0.85rem', color: '#374151' },
};