import { useState, useEffect } from 'react';
import type { Venda } from '../types/venda';
import { vendaService } from '../services/vendaService';
import { FORMAS_PAGAMENTO } from '../types/venda';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR');

const statusStyle: Record<string, React.CSSProperties> = {
  concluida: { background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' },
  cancelada:  { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5' },
  aberta:     { background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' },
};

export function Historico() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [vendaAberta, setVendaAberta] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    vendaService.listar({ status: filtroStatus || undefined })
      .then(r => setVendas(r.data))
      .finally(() => setCarregando(false));
  }, [filtroStatus]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.titulo}>📋 Histórico de Vendas</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'concluida', 'cancelada', 'aberta'].map(st => (
            <button key={st} onClick={() => setFiltroStatus(st)}
              style={{ ...s.filtroBtn, ...(filtroStatus === st ? s.filtroAtivo : {}) }}>
              {st === '' ? 'Todas' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div style={s.loading}>Carregando...</div>
      ) : vendas.length === 0 ? (
        <div style={s.vazio}>Nenhuma venda encontrada.</div>
      ) : (
        <div style={s.lista}>
          {vendas.map(v => {
            const aberta = vendaAberta === v.id;
            const fp = FORMAS_PAGAMENTO.find(f => f.valor === v.formaPagamento);
            return (
              <div key={v.id} style={s.card}>
                <div style={s.cardHeader} onClick={() => setVendaAberta(aberta ? null : v.id)}>
                  <div style={s.cardLeft}>
                    <span style={s.vendaId}>#{v.id.slice(0, 8).toUpperCase()}</span>
                    <span style={{ ...s.status, ...statusStyle[v.status] }}>{v.status}</span>
                  </div>
                  <div style={s.cardRight}>
                    {fp && <span style={s.forma}>{fp.emoji} {fp.label}</span>}
                    <span style={s.valor}>{fmt(v.valorTotal)}</span>
                    <span style={s.data}>{fmtData(v.criadoEm)}</span>
                    <span style={s.chevron}>{aberta ? '▲' : '▼'}</span>
                  </div>
                </div>
                {aberta && (
                  <div style={s.detalhes}>
                    <table style={s.tabela}>
                      <thead>
                        <tr style={{ background: '#F5EDD8' }}>
                          <th style={s.th}>Produto</th>
                          <th style={{ ...s.th, textAlign: 'center' }}>Qtd</th>
                          <th style={{ ...s.th, textAlign: 'right' }}>Unitário</th>
                          <th style={{ ...s.th, textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.itens?.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #F0E4CC' }}>
                            <td style={s.td}>{item.nomeProduto}</td>
                            <td style={{ ...s.td, textAlign: 'center' }}>{item.quantidade}</td>
                            <td style={{ ...s.td, textAlign: 'right' }}>{fmt(item.precoUnitario)}</td>
                            <td style={{ ...s.td, textAlign: 'right', fontWeight: 700, color: '#C8822A' }}>{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {v.troco != null && v.troco > 0 && (
                      <div style={s.troco}>Troco: {fmt(v.troco)}</div>
                    )}
                    {v.observacao && <div style={s.obs}>Obs: {v.observacao}</div>}
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
  page: { padding: '1.5rem 2rem', background: '#FDF6EC', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  titulo: { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#2C1A0E' },
  filtroBtn: { padding: '0.35rem 0.9rem', border: '1.5px solid #E0C9A8', borderRadius: '999px', cursor: 'pointer', background: '#FFFBF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#7A5C4E' },
  filtroAtivo: { background: '#C8822A', color: '#fff', borderColor: '#C8822A', fontWeight: 700 },
  loading: { textAlign: 'center', padding: '3rem', color: '#8B6F5E' },
  vazio: { textAlign: 'center', padding: '4rem', color: '#8B6F5E' },
  lista: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  card: { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', cursor: 'pointer' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  cardRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  vendaId: { fontFamily: "'Courier New', monospace", fontSize: '0.82rem', color: '#8B6F5E', fontWeight: 700 },
  status: { fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', fontFamily: "'DM Sans', sans-serif" },
  forma: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#5C3D2E' },
  valor: { fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#C8822A', fontWeight: 700 },
  data: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: '#A07850' },
  chevron: { color: '#A07850', fontSize: '0.75rem' },
  detalhes: { borderTop: '1px solid #F0E4CC', padding: '1rem 1.25rem', background: '#FFFDF8' },
  tabela: { width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" },
  th: { padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#7A5C4E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' },
  td: { padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#374151' },
  troco: { marginTop: '0.75rem', fontSize: '0.85rem', color: '#065F46', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 },
  obs: { marginTop: '0.4rem', fontSize: '0.82rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' },
};