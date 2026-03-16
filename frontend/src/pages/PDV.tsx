import { useState, useEffect, useCallback } from 'react';
import type { Venda } from '../types/venda';
import type { Produto } from '../types';
import { vendaService } from '../services/vendaService';
import { produtoService } from '../services/api';
import { Carrinho } from '../components/PDV/Carrinho';
import { ModalPagamento } from '../components/PDV/ModalPagamento';
import { CATEGORIAS } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PDV() {
  const [venda, setVenda] = useState<Venda | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroCateg, setFiltroCateg] = useState('');
  const [modalPagamento, setModalPagamento] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const iniciarVenda = useCallback(async () => {
    const v = await vendaService.criar();
    setVenda(v);
  }, []);

  useEffect(() => {
    iniciarVenda();
    produtoService.listar({ disponivel: true }).then(r => setProdutos(r.data));
  }, [iniciarVenda]);

  const produtosFiltrados = produtos.filter(p => {
    const okBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
    const okCateg = !filtroCateg || p.categoria === filtroCateg;
    return okBusca && okCateg;
  });

  const addProduto = async (produto: Produto) => {
    if (!venda) return;
    if (produto.estoque === 0) { setErro('Produto sem estoque'); return; }
    setCarregando(true);
    try {
      const v = await vendaService.adicionarItem(venda.id, produto.id, 1);
      setVenda(v);
      setErro('');
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao adicionar');
    } finally { setCarregando(false); }
  };

  const removerItem = async (itemId: string) => {
    if (!venda) return;
    const v = await vendaService.removerItem(venda.id, itemId);
    setVenda(v);
  };

  const alterarQtd = async (itemId: string, qtd: number) => {
    if (!venda) return;
    try {
      const v = await vendaService.atualizarQuantidade(venda.id, itemId, qtd);
      setVenda(v);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Estoque insuficiente');
    }
  };

  const cancelarVenda = async () => {
    if (!venda || venda.itens.length === 0) return;
    await vendaService.cancelar(venda.id);
    await iniciarVenda();
    setErro('');
  };

  const concluirVenda = async (forma: string, valorPago: number, obs: string) => {
    if (!venda) return;
    await vendaService.concluir(venda.id, forma, valorPago, obs);
    setModalPagamento(false);
    setSucesso(`Venda #${venda.id.slice(0, 8)} concluída! ${fmt(valorPago - venda.valorTotal)} de troco.`);
    await iniciarVenda();
    await produtoService.listar({ disponivel: true }).then(r => setProdutos(r.data));
    setTimeout(() => setSucesso(''), 5000);
  };

  return (
    <div style={s.page}>
      <div style={s.produtos}>
        <div style={s.toolbar}>
          <input style={s.busca} placeholder="🔍 Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
          <div style={s.categorias}>
            <button style={{ ...s.catBtn, ...(filtroCateg === '' ? s.catAtivo : {}) }} onClick={() => setFiltroCateg('')}>Todos</button>
            {CATEGORIAS.map(c => (
              <button key={c.valor}
                style={{ ...s.catBtn, ...(filtroCateg === c.valor ? s.catAtivo : {}) }}
                onClick={() => setFiltroCateg(c.valor)}>
                {c.emoji}
              </button>
            ))}
          </div>
        </div>

        {sucesso && <div style={s.sucesso}>{sucesso}</div>}
        {erro && <div style={s.erroBox} onClick={() => setErro('')}>{erro} ✕</div>}

        <div style={s.grid}>
          {produtosFiltrados.map(p => {
            const semEstoque = p.estoque === 0;
            return (
              <button key={p.id} style={{ ...s.card, opacity: semEstoque ? 0.5 : 1 }}
                onClick={() => addProduto(p)} disabled={semEstoque || carregando}>
                <div style={s.cardEmoji}>{CATEGORIAS.find(c => c.valor === p.categoria)?.emoji ?? '🛒'}</div>
                <div style={s.cardNome}>{p.nome}</div>
                <div style={s.cardPreco}>{fmt(p.preco)}</div>
                <div style={{ ...s.cardEstoque, color: p.estoque < 10 ? '#B91C1C' : '#065F46' }}>
                  {semEstoque ? '⚠️ Sem estoque' : `${p.estoque} un.`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={s.sidebar}>
        {venda && (
          <Carrinho
            venda={venda}
            onRemover={removerItem}
            onAlterarQtd={alterarQtd}
            onConcluir={() => setModalPagamento(true)}
            onCancelar={cancelarVenda}
          />
        )}
      </div>

      {venda && (
        <ModalPagamento
          aberto={modalPagamento}
          valorTotal={venda.valorTotal}
          onConfirmar={concluirVenda}
          onFechar={() => setModalPagamento(false)}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', height: 'calc(100vh - 80px)', padding: '1.25rem', background: '#FDF6EC', boxSizing: 'border-box' },
  produtos: { display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' },
  toolbar: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  busca: { padding: '0.6rem 1rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', background: '#FFFBF5', outline: 'none' },
  categorias: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  catBtn: { padding: '0.35rem 0.75rem', border: '1.5px solid #E0C9A8', borderRadius: '999px', cursor: 'pointer', background: '#FFFBF5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#7A5C4E' },
  catAtivo: { background: '#C8822A', color: '#fff', borderColor: '#C8822A', fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', overflowY: 'auto', paddingBottom: '1rem' },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.9rem 0.6rem', background: '#FFFBF5', border: '1.5px solid #E8D5B0', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center', gap: '0.25rem' },
  cardEmoji: { fontSize: '2rem' },
  cardNome: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#2C1A0E', lineHeight: 1.2 },
  cardPreco: { fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#C8822A', fontWeight: 700 },
  cardEstoque: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600 },
  sidebar: { height: '100%' },
  sucesso: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '0.5rem', padding: '0.6rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600 },
  erroBox: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '0.5rem', padding: '0.6rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', cursor: 'pointer' },
};