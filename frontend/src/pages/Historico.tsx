import { useState, useEffect } from 'react';
import type { Venda } from '../types/venda';
import { vendaService } from '../services/vendaService';
import { FORMAS_PAGAMENTO } from '../types/venda';
import { useResponsive } from '../hooks/useResponsive';

const fmt     = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR');
const hoje    = () => new Date().toISOString().split('T')[0];

const statusStyle: Record<string, React.CSSProperties> = {
  concluida: { background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' },
  cancelada: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5' },
};

export function Historico() {
  const { isMobile } = useResponsive();

  const [vendas, setVendas]             = useState<Venda[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('concluida');
  const [dataInicio, setDataInicio]     = useState(hoje);   // ← padrão = hoje
  const [dataFim, setDataFim]           = useState(hoje);   // ← padrão = hoje
  const [vendaAberta, setVendaAberta]   = useState<string | null>(null);
  const [carregando, setCarregando]     = useState(true);

  useEffect(() => {
    setCarregando(true);
    vendaService
      .listar({ status: filtroStatus, dataInicio, dataFim })
      .then(r => setVendas(r.data))
      .finally(() => setCarregando(false));
  }, [filtroStatus, dataInicio, dataFim]);

  // ── Atalhos de período ─────────────────────────────────────
  const atalhos = [
    {
      label: 'Hoje',
      acao: () => { setDataInicio(hoje()); setDataFim(hoje()); },
    },
    {
      label: 'Ontem',
      acao: () => {
        const d = new Date(); d.setDate(d.getDate() - 1);
        const s = d.toISOString().split('T')[0];
        setDataInicio(s); setDataFim(s);
      },
    },
    {
      label: '7 dias',
      acao: () => {
        const d = new Date(); d.setDate(d.getDate() - 6);
        setDataInicio(d.toISOString().split('T')[0]); setDataFim(hoje());
      },
    },
    {
      label: '30 dias',
      acao: () => {
        const d = new Date(); d.setDate(d.getDate() - 29);
        setDataInicio(d.toISOString().split('T')[0]); setDataFim(hoje());
      },
    },
  ];

  const isHoje   = dataInicio === hoje() && dataFim === hoje();
  const totalDia = vendas.reduce((acc, v) => acc + v.valorTotal, 0);

  return (
    <div style={{ ...s.page, padding: isMobile ? '1rem' : '1.5rem 2rem' }}>

      {/* ── Header ── */}
      <div style={{ ...s.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <h2 style={{ ...s.titulo, fontSize: isMobile ? '1.3rem' : '1.6rem' }}>
          📋 Histórico de Vendas
        </h2>

        {/* Filtros de status */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { val: 'concluida', label: '✅ Concluídas' },
            { val: 'cancelada', label: '❌ Canceladas' },
          ].map(st => (
            <button key={st.val} onClick={() => setFiltroStatus(st.val)}
              style={{ ...s.filtroBtn, ...(filtroStatus === st.val ? s.filtroAtivo : {}) }}>
              {isMobile ? (st.val === 'concluida' ? '✅' : '❌') : st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtro de datas ── */}
      <div style={{ background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', padding: isMobile ? '0.85rem' : '1rem 1.25rem', marginBottom: '1rem' }}>

        {/* Atalhos rápidos */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {atalhos.map(a => {
            const ativo = a.label === 'Hoje' && isHoje;
            return (
              <button key={a.label} onClick={a.acao} style={{
                padding: '0.3rem 0.85rem',
                border: `1.5px solid ${ativo ? '#C8822A' : '#E0C9A8'}`,
                borderRadius: '999px', cursor: 'pointer',
                background: ativo ? '#C8822A' : '#FDF6EC',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem',
                color: ativo ? '#fff' : '#7A5C4E',
                fontWeight: ativo ? 700 : 500,
              }}>
                {a.label}
              </button>
            );
          })}
        </div>

        {/* Inputs de data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#8B6F5E', flexShrink: 0 }}>
            De
          </span>
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            style={{ ...s.dateInput, maxWidth: isMobile ? 135 : 'auto' }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#8B6F5E', flexShrink: 0 }}>
            até
          </span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
            style={{ ...s.dateInput, maxWidth: isMobile ? 135 : 'auto' }} />
        </div>
      </div>

      {/* ── Resumo do período ── */}
      {!carregando && vendas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: '0.65rem', marginBottom: '1rem' }}>
          {[
            { emoji: '🧾', label: 'Vendas no período', valor: vendas.length },
            { emoji: '💰', label: 'Total faturado', valor: fmt(totalDia) },
            { emoji: '📈', label: 'Ticket médio', valor: fmt(vendas.length > 0 ? totalDia / vendas.length : 0) },
          ].map(card => (
            <div key={card.label} style={{ background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.65rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{card.emoji}</span>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C1A0E', fontWeight: 700 }}>{card.valor}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', color: '#8B6F5E', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista ── */}
      {carregando ? (
        <div style={s.loading}>Carregando...</div>
      ) : vendas.length === 0 ? (
        <div style={s.vazio}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧾</div>
          <p>Nenhuma venda {filtroStatus === 'concluida' ? 'concluída' : 'cancelada'} no período.</p>
        </div>
      ) : (
        <div style={s.lista}>
          {vendas.map(v => {
            const expandida = vendaAberta === v.id;
            const fp = FORMAS_PAGAMENTO.find(f => f.valor === v.formaPagamento);

            return (
              <div key={v.id} style={s.card}>

                {/* Cabeçalho */}
                <div style={{ ...s.cardHeader, padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.25rem' }}
                  onClick={() => setVendaAberta(expandida ? null : v.id)}>

                  <div style={{ ...s.cardLeft, gap: isMobile ? '0.4rem' : '0.6rem' }}>
                    <span style={s.vendaId}>#{v.id.slice(0, 8).toUpperCase()}</span>
                    <span style={{ ...s.statusTag, ...statusStyle[v.status] }}>{v.status}</span>
                    {!isMobile && (v as any).usuarioNome && (
                      <span style={s.operadorTag}>👷 {(v as any).usuarioNome}</span>
                    )}
                  </div>

                  <div style={{ ...s.cardRight, gap: isMobile ? '0.5rem' : '1rem' }}>
                    {!isMobile && fp && <span style={s.forma}>{fp.emoji} {fp.label}</span>}
                    <span style={{ ...s.valor, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
                      {fmt(v.valorTotal)}
                    </span>
                    {!isMobile && <span style={s.data}>{fmtData(v.criadoEm)}</span>}
                    <span style={s.chevron}>{expandida ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Resumo rápido — mobile mostra data aqui */}
                {!expandida && (
                  <div style={{ ...s.resumoItens, padding: isMobile ? '0 1rem 0.65rem' : '0 1.25rem 0.75rem' }}>
                    {isMobile && (
                      <span style={{ fontSize: '0.72rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif", width: '100%', marginBottom: '0.25rem' }}>
                        🕐 {fmtData(v.criadoEm)}
                        {(v as any).usuarioNome && ` · 👷 ${(v as any).usuarioNome}`}
                        {fp && ` · ${fp.emoji} ${fp.label}`}
                      </span>
                    )}
                    {v.itens?.map(item => (
                      <span key={item.id} style={s.itemPill}>
                        {item.nomeProduto} × {item.quantidade}
                      </span>
                    ))}
                  </div>
                )}

                {/* Detalhes expandidos */}
                {expandida && (
                  <div style={{ ...s.detalhes, padding: isMobile ? '0.85rem 1rem' : '1rem 1.25rem' }}>

                    <div style={{ ...s.infoRow, gap: isMobile ? '0.65rem' : '1rem' }}>
                      <div style={s.infoBlock}>
                        <span style={s.infoLabel}>Operador</span>
                        <span style={s.infoValor}>👷 {(v as any).usuarioNome || 'Não registrado'}</span>
                      </div>
                      {v.concluidoEm && (
                        <div style={s.infoBlock}>
                          <span style={s.infoLabel}>Concluído em</span>
                          <span style={s.infoValor}>🕐 {fmtData(v.concluidoEm)}</span>
                        </div>
                      )}
                      {fp && (
                        <div style={s.infoBlock}>
                          <span style={s.infoLabel}>Pagamento</span>
                          <span style={s.infoValor}>{fp.emoji} {fp.label}</span>
                        </div>
                      )}
                      {v.valorPago != null && (
                        <div style={s.infoBlock}>
                          <span style={s.infoLabel}>Valor Pago</span>
                          <span style={s.infoValor}>💵 {fmt(v.valorPago)}</span>
                        </div>
                      )}
                      {v.troco != null && v.troco > 0 && (
                        <div style={s.infoBlock}>
                          <span style={s.infoLabel}>Troco</span>
                          <span style={s.infoValor}>🔄 {fmt(v.troco)}</span>
                        </div>
                      )}
                    </div>

                    {v.itens && v.itens.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ ...s.tabela, minWidth: isMobile ? 320 : 'auto' }}>
                          <thead>
                            <tr style={{ background: '#F5EDD8' }}>
                              <th style={s.th}>Produto</th>
                              <th style={{ ...s.th, textAlign: 'center' }}>Qtd</th>
                              <th style={{ ...s.th, textAlign: 'right' }}>Unit.</th>
                              <th style={{ ...s.th, textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {v.itens.map(item => (
                              <tr key={item.id} style={{ borderBottom: '1px solid #F0E4CC' }}>
                                <td style={{ ...s.td, fontWeight: 500 }}>{item.nomeProduto}</td>
                                <td style={{ ...s.td, textAlign: 'center' }}>
                                  <span style={{ background: '#EFF6FF', color: '#0EA5E9', borderRadius: '999px', padding: '2px 10px', fontWeight: 700, fontSize: '0.82rem' }}>
                                    {item.quantidade} un.
                                  </span>
                                </td>
                                <td style={{ ...s.td, textAlign: 'right', color: '#6B7280' }}>{fmt(item.precoUnitario)}</td>
                                <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A' }}>{fmt(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: '#FDF6EC', borderTop: '2px solid #E8D5B0' }}>
                              <td colSpan={3} style={{ ...s.td, fontWeight: 700, color: '#2C1A0E' }}>TOTAL DA VENDA</td>
                              <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A', fontSize: '1rem' }}>{fmt(v.valorTotal)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', margin: 0 }}>
                        Sem itens registrados.
                      </p>
                    )}

                    {v.observacao && <div style={s.obs}>📝 {v.observacao}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '1.5rem 2rem', background: '#FDF6EC', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' },
  titulo:      { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E' },
  filtroBtn:   { padding: '0.4rem 1rem', border: '1.5px solid #E0C9A8', borderRadius: '999px', cursor: 'pointer', background: '#FFFBF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#7A5C4E' },
  filtroAtivo: { background: '#C8822A', color: '#fff', borderColor: '#C8822A', fontWeight: 700 },
  dateInput:   { padding: '0.4rem 0.65rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', background: '#FFFDF8', outline: 'none' },
  loading:     { textAlign: 'center', padding: '3rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif" },
  vazio:       { textAlign: 'center', padding: '4rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif" },
  lista:       { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  card:        { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', overflow: 'hidden' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', cursor: 'pointer' },
  cardLeft:    { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  cardRight:   { display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 },
  vendaId:     { fontFamily: "'Courier New', monospace", fontSize: '0.82rem', color: '#8B6F5E', fontWeight: 700 },
  statusTag:   { fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', fontFamily: "'DM Sans', sans-serif" },
  operadorTag: { fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: '999px', background: '#F5F3FF', color: '#7C3AED', fontFamily: "'DM Sans', sans-serif" },
  forma:       { fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#5C3D2E' },
  valor:       { fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#C8822A', fontWeight: 700 },
  data:        { fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#A07850' },
  chevron:     { color: '#A07850', fontSize: '0.75rem' },
  resumoItens: { padding: '0 1.25rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  itemPill:    { fontSize: '0.75rem', background: '#FFF3E0', color: '#C8822A', border: '1px solid #FED7AA', borderRadius: '999px', padding: '2px 10px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 },
  detalhes:    { borderTop: '1px solid #F0E4CC', padding: '1rem 1.25rem', background: '#FFFDF8' },
  infoRow:     { display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', padding: '0.75rem', background: '#F5EDD8', borderRadius: '0.5rem' },
  infoBlock:   { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  infoLabel:   { fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', color: '#A07850', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 },
  infoValor:   { fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#2C1A0E', fontWeight: 600 },
  tabela:      { width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" },
  th:          { padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#7A5C4E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' },
  td:          { padding: '0.55rem 0.75rem', fontSize: '0.85rem', color: '#374151' },
  obs:         { marginTop: '0.75rem', fontSize: '0.82rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' },
};