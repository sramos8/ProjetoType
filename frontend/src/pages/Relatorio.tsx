import { useState, useEffect } from 'react';
import type { Relatorio as RelatorioType } from '../types/venda';
import { vendaService } from '../services/vendaService';
import { FORMAS_PAGAMENTO } from '../types/venda';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Relatorio() {
  const [dados, setDados] = useState<RelatorioType | null>(null);
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    vendaService.relatorio(dataInicio, dataFim)
      .then(setDados)
      .finally(() => setCarregando(false));
  }, [dataInicio, dataFim]);

  if (carregando || !dados) return <div style={{ padding: '2rem', color: '#8B6F5E', textAlign: 'center' }}>Carregando relatório...</div>;

  const maxDia = Math.max(...dados.vendasPorDia.map(d => d.total), 1);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.titulo}>📊 Relatório de Faturamento</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={s.dateInput} />
          <span style={{ color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif" }}>até</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={s.dateInput} />
        </div>
      </div>

      {/* Cards de resumo */}
      <div style={s.statsGrid}>
        {[
          { label: 'Faturamento', valor: fmt(dados.resumo.faturamentoBruto), emoji: '💰', cor: '#C8822A' },
          { label: 'Vendas', valor: dados.resumo.totalVendas, emoji: '🧾', cor: '#0EA5E9' },
          { label: 'Ticket Médio', valor: fmt(dados.resumo.ticketMedio), emoji: '📈', cor: '#7C3AED' },
          { label: 'Canceladas', valor: dados.resumo.canceladas, emoji: '❌', cor: '#DC2626' },
        ].map(card => (
          <div key={card.label} style={s.statCard}>
            <div style={s.statEmoji}>{card.emoji}</div>
            <div style={{ ...s.statValor, color: card.cor }}>{card.valor}</div>
            <div style={s.statLabel}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={s.grid2}>
        {/* Formas de pagamento */}
        <div style={s.secao}>
          <h3 style={s.secaoTitulo}>💳 Por Forma de Pagamento</h3>
          {dados.porFormaPagamento.length === 0
            ? <p style={s.vazio}>Sem dados</p>
            : dados.porFormaPagamento.map(fp => {
              const info = FORMAS_PAGAMENTO.find(f => f.valor === fp.formaPagamento);
              return (
                <div key={fp.formaPagamento} style={s.fpItem}>
                  <span style={s.fpLabel}>{info?.emoji} {info?.label ?? fp.formaPagamento}</span>
                  <div style={s.fpBar}>
                    <div style={{ ...s.fpBarFill, width: `${(fp.total / dados.resumo.faturamentoBruto) * 100}%` }} />
                  </div>
                  <span style={s.fpValor}>{fmt(fp.total)}</span>
                  <span style={s.fpQtd}>({fp.qtd}x)</span>
                </div>
              );
            })}
        </div>

        {/* Produtos mais vendidos */}
        <div style={s.secao}>
          <h3 style={s.secaoTitulo}>🏆 Mais Vendidos</h3>
          {dados.produtosMaisVendidos.length === 0
            ? <p style={s.vazio}>Sem dados</p>
            : dados.produtosMaisVendidos.slice(0, 8).map((p, i) => (
              <div key={p.nomeProduto} style={s.rankItem}>
                <span style={s.rank}>#{i + 1}</span>
                <span style={s.rankNome}>{p.nomeProduto}</span>
                <span style={s.rankQtd}>{p.totalQtd} un.</span>
                <span style={s.rankValor}>{fmt(p.totalValor)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Gráfico por dia */}
      <div style={s.secao}>
        <h3 style={s.secaoTitulo}>📅 Faturamento por Dia</h3>
        {dados.vendasPorDia.length === 0
          ? <p style={s.vazio}>Sem dados no período</p>
          : (
            <div style={s.grafico}>
              {[...dados.vendasPorDia].reverse().map(d => (
                <div key={d.dia} style={s.barra}>
                  <span style={s.barraValor}>{fmt(d.total)}</span>
                  <div style={{ ...s.barraFill, height: `${(d.total / maxDia) * 140}px` }} title={fmt(d.total)} />
                  <span style={s.barraDia}>{d.dia.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '1.5rem 2rem', background: '#FDF6EC', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  titulo: { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E' },
  dateInput: { padding: '0.4rem 0.75rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', background: '#FFFBF5' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' },
  statCard: { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', padding: '1.1rem', textAlign: 'center' },
  statEmoji: { fontSize: '1.75rem', marginBottom: '0.4rem' },
  statValor: { fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' },
  statLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#8B6F5E', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  secao: { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', padding: '1.25rem' },
  secaoTitulo: { margin: '0 0 1rem', fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C1A0E' },
  vazio: { color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', margin: 0 },
  fpItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' },
  fpLabel: { width: 90, fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#374151', flexShrink: 0 },
  fpBar: { flex: 1, height: 10, background: '#F0E4CC', borderRadius: '999px', overflow: 'hidden' },
  fpBarFill: { height: '100%', background: 'linear-gradient(90deg, #C8822A, #F59E0B)', borderRadius: '999px', transition: 'width 0.4s ease' },
  fpValor: { fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', color: '#C8822A', fontWeight: 700, flexShrink: 0 },
  fpQtd: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#A07850', flexShrink: 0 },
  rankItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid #F0E4CC' },
  rank: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#C8822A', width: 24, flexShrink: 0 },
  rankNome: { flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#374151' },
  rankQtd: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#8B6F5E', flexShrink: 0 },
  rankValor: { fontFamily: "'Playfair Display', serif", fontSize: '0.88rem', color: '#C8822A', fontWeight: 700, flexShrink: 0 },
  grafico: { display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: 200, overflowX: 'auto', paddingBottom: '0.5rem' },
  barra: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: 48 },
  barraValor: { fontSize: '0.6rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', lineHeight: 1.1 },
  barraFill: { width: 32, background: 'linear-gradient(180deg, #C8822A, #F59E0B)', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.3s ease' },
  barraDia: { fontSize: '0.65rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif" },
};