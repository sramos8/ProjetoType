import { useState, useEffect } from 'react';
import type { Venda } from '../types/venda';
import { vendaService } from '../services/vendaService';
import { FORMAS_PAGAMENTO } from '../types/venda';

const fmt     = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR');

const statusStyle: Record<string, React.CSSProperties> = {
  concluida: { background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' },
  cancelada: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5' },
};

export function Historico() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('concluida');
  const [vendaAberta, setVendaAberta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    vendaService
      .listar({ status: filtroStatus })
      .then(r => setVendas(r.data))
      .finally(() => setCarregando(false));
  }, [filtroStatus]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.titulo}>📋 Histórico de Vendas</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { val: 'concluida', label: '✅ Concluídas' },
            { val: 'cancelada', label: '❌ Canceladas' },
          ].map(st => (
            <button
              key={st.val}
              onClick={() => setFiltroStatus(st.val)}
              style={{ ...s.filtroBtn, ...(filtroStatus === st.val ? s.filtroAtivo : {}) }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div style={s.loading}>Carregando...</div>
      ) : vendas.length === 0 ? (
        <div style={s.vazio}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧾</div>
          <p>Nenhuma venda {filtroStatus === 'concluida' ? 'concluída' : 'cancelada'} encontrada.</p>
        </div>
      ) : (
        <div style={s.lista}>
          {vendas.map(v => {
            const expandida = vendaAberta === v.id;
            const fp = FORMAS_PAGAMENTO.find(f => f.valor === v.formaPagamento);

            return (
              <div key={v.id} style={s.card}>

                {/* ── Cabeçalho do card ── */}
                <div
                  style={s.cardHeader}
                  onClick={() => setVendaAberta(expandida ? null : v.id)}
                >
                  <div style={s.cardLeft}>
                    <span style={s.vendaId}>#{v.id.slice(0, 8).toUpperCase()}</span>
                    <span style={{ ...s.statusTag, ...statusStyle[v.status] }}>
                      {v.status}
                    </span>
                    {/* Operador */}
                    {v.usuarioNome && (
                      <span style={s.operadorTag}>
                        👷 {v.usuarioNome}
                      </span>
                    )}
                  </div>
                  <div style={s.cardRight}>
                    {fp && <span style={s.forma}>{fp.emoji} {fp.label}</span>}
                    <span style={s.valor}>{fmt(v.valorTotal)}</span>
                    <span style={s.data}>{fmtData(v.criadoEm)}</span>
                    <span style={s.chevron}>{expandida ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* ── Resumo rápido de itens (sempre visível) ── */}
                {!expandida && v.itens && v.itens.length > 0 && (
                  <div style={s.resumoItens}>
                    {v.itens.map(item => (
                      <span key={item.id} style={s.itemPill}>
                        {item.nomeProduto} × {item.quantidade}
                      </span>
                    ))}
                  </div>
                )}

                {/* ── Detalhes expandidos ── */}
                {expandida && (
                  <div style={s.detalhes}>

                    {/* Info operador completa */}
                    <div style={s.infoRow}>
                      <div style={s.infoBlock}>
                        <span style={s.infoLabel}>Operador</span>
                        <span style={s.infoValor}>👷 {v.usuarioNome || 'Não registrado'}</span>
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

                    {/* Tabela de itens */}
                    {v.itens && v.itens.length > 0 ? (
                      <table style={s.tabela}>
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
                                <span style={{
                                  background: '#EFF6FF', color: '#0EA5E9',
                                  borderRadius: '999px', padding: '2px 10px',
                                  fontWeight: 700, fontSize: '0.82rem',
                                }}>
                                  {item.quantidade} un.
                                </span>
                              </td>
                              <td style={{ ...s.td, textAlign: 'right', color: '#6B7280' }}>
                                {fmt(item.precoUnitario)}
                              </td>
                              <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A' }}>
                                {fmt(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#FDF6EC', borderTop: '2px solid #E8D5B0' }}>
                            <td colSpan={3} style={{ ...s.td, fontWeight: 700, color: '#2C1A0E' }}>
                              TOTAL DA VENDA
                            </td>
                            <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A', fontSize: '1rem' }}>
                              {fmt(v.valorTotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <p style={{ color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', margin: 0 }}>
                        Sem itens registrados.
                      </p>
                    )}

                    {v.observacao && (
                      <div style={s.obs}>📝 {v.observacao}</div>
                    )}
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
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  titulo:      { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E' },
  filtroBtn:   { padding: '0.4rem 1rem', border: '1.5px solid #E0C9A8', borderRadius: '999px', cursor: 'pointer', background: '#FFFBF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#7A5C4E' },
  filtroAtivo: { background: '#C8822A', color: '#fff', borderColor: '#C8822A', fontWeight: 700 },
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