import { useState, useEffect, useCallback } from 'react';
import type { Venda } from '../types/venda';
import type { Produto } from '../types';
import { vendaService } from '../services/vendaService';
import { produtoService } from '../services/api';
import { Carrinho } from '../components/PDV/Carrinho';
import { ModalPagamento } from '../components/PDV/ModalPagamento';
import { CATEGORIAS } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { useSom } from '../hooks/useSom';
import { useBarcode } from '../hooks/useBarcode';
import { ModalCamera } from '../components/PDV/ModalCamera';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function PDV() {
  const { isMobile, isTablet } = useResponsive();
  const compact = isMobile || isTablet;

  const [venda, setVenda] = useState<Venda | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroCateg, setFiltroCateg] = useState('');
  const [modalPagamento, setModalPagamento] = useState(false);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { tocar } = useSom();
  const [barcodeAtivo, setBarcodeAtivo] = useState(true);
  const [barcodeMsg, setBarcodeMsg]     = useState('');
  const [cameraAberta, setCameraAberta] = useState(false);

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
  if (produto.estoque === 0) { setErro('Produto sem estoque'); tocar('erro'); return; }
  setCarregando(true);
  try {
    // Usa preço sugerido do código de balança se disponível
    const preco = produto.precoSugerido ?? produto.preco;
    const v = await vendaService.adicionarItem(venda.id, produto.id, 1, preco);
    setVenda(v);
    tocar('produto');
    setErro('');
    if (isMobile && v.itens.length === 1) setCarrinhoAberto(true);
  } catch (e: unknown) {
    tocar('erro');
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
    setCarrinhoAberto(false);
  };

  const concluirVenda = async (forma: string, valorPago: number, obs: string) => {
    if (!venda) return;
    await vendaService.concluir(venda.id, forma, valorPago, obs);
    tocar('venda');  // ← acorde de sucesso
    setModalPagamento(false);
    setCarrinhoAberto(false);
    setSucesso(`Venda #${venda.id.slice(0, 8)} concluída! ${fmt(valorPago - venda.valorTotal)} de troco.`);
    await iniciarVenda();
    await produtoService.listar({ disponivel: true }).then(r => setProdutos(r.data));
    setTimeout(() => setSucesso(''), 5000);
  };

  // Hook de leitor de código de barras
useBarcode({
  ativo: barcodeAtivo && !modalPagamento,
  onLeitura: async (codigo) => {
    setBarcodeMsg('');
    try {
      const produto = await produtoService.buscarPorBarcode(codigo);
      if (produto.estoque === 0) {
        tocar('erro');
        setBarcodeMsg(`❌ ${produto.nome} sem estoque`);
        setTimeout(() => setBarcodeMsg(''), 3000);
        return;
      }
      // Adiciona direto com preço embutido do código de balança
      await addProduto(produto);
      setBarcodeMsg(`✅ ${produto.nome} — R$ ${(produto.precoSugerido ?? produto.preco).toFixed(2)}`);
      setTimeout(() => setBarcodeMsg(''), 2500);
    } catch {
      tocar('erro');
      setBarcodeMsg(`❌ Código ${codigo} não encontrado`);
      setTimeout(() => setBarcodeMsg(''), 3000);
    }
  },
});

const handleCameraLeitura = useCallback(async (codigo: string) => {
  try {
    const produto = await produtoService.buscarPorBarcode(codigo);
    setCameraAberta(false);
    if (produto.estoque === 0) {
      tocar('erro');
      setErro(`❌ ${produto.nome} sem estoque`);
      setTimeout(() => setErro(''), 3000);
      return;
    }
    await addProduto(produto);
  } catch {
    tocar('erro');
    setErro(`❌ Código não encontrado`);
    setTimeout(() => setErro(''), 3000);
  }
}, [venda, tocar]);

  const totalItens = venda?.itens.reduce((acc, i) => acc + i.quantidade, 0) ?? 0;
const alterarPrecoItem = async (itemId: string, novoPreco: number) => {
  if (!venda) return;
  try {
    const v = await vendaService.alterarPreco(venda.id, itemId, novoPreco);
    setVenda(v);
    tocar('produto');
  } catch (e: unknown) {
    setErro(e instanceof Error ? e.message : 'Erro ao alterar preço');
  }
};

  return (
    <div style={{
      display: compact ? 'flex' : 'grid',
      flexDirection: compact ? 'column' : undefined,
      gridTemplateColumns: compact ? undefined : '1fr 360px',
      gap: compact ? '0' : '1.25rem',
      height: compact ? 'auto' : 'calc(100vh - 80px)',
      minHeight: compact ? 'calc(100vh - 80px)' : undefined,
      padding: compact ? '0' : '1.25rem',
      background: '#FDF6EC',
      boxSizing: 'border-box',
      position: 'relative',
    }}>

      {/* ── Área de produtos ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        overflow: compact ? 'visible' : 'hidden',
        padding: compact ? '1rem' : '0',
        flex: compact ? 1 : undefined,
      }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input
            style={{ padding: '0.6rem 1rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', background: '#FFFBF5', outline: 'none' }}
            placeholder="🔍 Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              style={{ padding: '0.35rem 0.75rem', border: '1.5px solid #E0C9A8', borderRadius: '999px', cursor: 'pointer', background: filtroCateg === '' ? '#C8822A' : '#FFFBF5', color: filtroCateg === '' ? '#fff' : '#7A5C4E', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: filtroCateg === '' ? 700 : 400, borderColor: filtroCateg === '' ? '#C8822A' : '#E0C9A8' }}
              onClick={() => setFiltroCateg('')}
            >
              {isMobile ? '🏠' : 'Todos'}
            </button>
            {CATEGORIAS.map(c => (
              <button key={c.valor}
                style={{ padding: '0.35rem 0.75rem', border: `1.5px solid ${filtroCateg === c.valor ? '#C8822A' : '#E0C9A8'}`, borderRadius: '999px', cursor: 'pointer', background: filtroCateg === c.valor ? '#C8822A' : '#FFFBF5', color: filtroCateg === c.valor ? '#fff' : '#7A5C4E', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: filtroCateg === c.valor ? 700 : 400 }}
                onClick={() => setFiltroCateg(c.valor)}
              >
                {isMobile ? c.emoji : `${c.emoji} ${c.label}`}
              </button>
            ))}
          </div>
        </div>

        {sucesso && (
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '0.5rem', padding: '0.6rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', fontWeight: 600 }}>
            {sucesso}
          </div>
        )}
        {erro && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '0.5rem', padding: '0.6rem 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.875rem', cursor: 'pointer' }}
            onClick={() => setErro('')}>
            {erro} ✕
          </div>
        )}
        {/* Grid de códigos de barras */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: barcodeAtivo ? '#ECFDF5' : '#F5F5F5',
          border: `1px solid ${barcodeAtivo ? '#6EE7B7' : '#E0C9A8'}`,
          borderRadius: '0.5rem', padding: '0.5rem 0.85rem',
          transition: 'all 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📷</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: barcodeAtivo ? '#065F46' : '#8B6F5E', fontWeight: 600 }}>
              {barcodeAtivo ? 'Leitor de código de barras ativo' : 'Leitor desativado'}
            </span>
            {barcodeMsg && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: barcodeMsg.startsWith('✅') ? '#065F46' : '#B91C1C', marginLeft: '0.5rem' }}>
                {barcodeMsg}
              </span>
            )}
          </div>
          <button
            onClick={() => setBarcodeAtivo(v => !v)}
            style={{
              padding: '0.25rem 0.75rem', border: `1px solid ${barcodeAtivo ? '#10B981' : '#E0C9A8'}`,
              borderRadius: '999px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
              background: barcodeAtivo ? '#10B981' : '#FFFBF5',
              color: barcodeAtivo ? '#fff' : '#8B6F5E',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {barcodeAtivo ? 'ON' : 'OFF'}
          </button>
        </div>

            {/* Banner do leitor — troque pelo código abaixo */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: barcodeAtivo ? '#ECFDF5' : '#F5F5F5',
                border: `1px solid ${barcodeAtivo ? '#6EE7B7' : '#E0C9A8'}`,
                borderRadius: '0.5rem', padding: '0.5rem 0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>📷</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: barcodeAtivo ? '#065F46' : '#8B6F5E', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {barcodeMsg || (barcodeAtivo ? 'Leitor USB/BT ativo — aponte para a tela' : 'Leitor USB/BT desativado')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                  {/* Botão câmera */}
                  <button
                    onClick={() => setCameraAberta(true)}
                    title="Usar câmera do celular"
                    style={{ padding: '0.3rem 0.75rem', border: '1px solid #BAE6FD', borderRadius: '999px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, background: '#EFF6FF', color: '#0EA5E9', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    📱 Câmera
                  </button>

                  {/* Toggle USB */}
                  <button
                    onClick={() => setBarcodeAtivo(v => !v)}
                    style={{ padding: '0.3rem 0.65rem', border: `1px solid ${barcodeAtivo ? '#10B981' : '#E0C9A8'}`, borderRadius: '999px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, background: barcodeAtivo ? '#10B981' : '#FFFBF5', color: barcodeAtivo ? '#fff' : '#8B6F5E', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    USB {barcodeAtivo ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Modal câmera */}
              <ModalCamera
                aberto={cameraAberta}
                onLeitura={handleCameraLeitura}
                onFechar={() => setCameraAberta(false)}
              />


        {/* Grid de produtos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(auto-fill, minmax(100px, 1fr))'
            : isTablet
              ? 'repeat(auto-fill, minmax(120px, 1fr))'
              : 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: compact ? '0.6rem' : '0.75rem',
          overflowY: compact ? 'visible' : 'auto',
          paddingBottom: isMobile ? '8rem' : '1rem', // espaço para o FAB
        }}>
          {produtosFiltrados.map(p => {
            const semEstoque = p.estoque === 0;
            return (
              <button
                key={p.id}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: isMobile ? '0.75rem 0.4rem' : '0.9rem 0.6rem',
                  background: '#FFFBF5', border: '1.5px solid #E8D5B0',
                  borderRadius: '0.75rem', cursor: semEstoque ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', textAlign: 'center', gap: '0.2rem',
                  opacity: semEstoque ? 0.5 : 1,
                }}
                onClick={() => addProduto(p)}
                disabled={semEstoque || carregando}
              >
                <div style={{ fontSize: isMobile ? '1.6rem' : '2rem' }}>
                  {CATEGORIAS.find(c => c.valor === p.categoria)?.emoji ?? '🛒'}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? '0.72rem' : '0.8rem', fontWeight: 600, color: '#2C1A0E', lineHeight: 1.2 }}>
                  {p.nome}
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '0.88rem' : '1rem', color: '#C8822A', fontWeight: 700 }}>
                  {fmt(p.preco)}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600, color: p.estoque < 10 ? '#B91C1C' : '#065F46' }}>
                  {semEstoque ? '⚠️ Esgotado' : `${p.estoque} un.`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sidebar desktop ── */}
      {!compact && (
        <div style={{ height: '100%' }}>
          {venda && (
            <Carrinho
              venda={venda}
              onRemover={removerItem}
              onAlterarQtd={alterarQtd}
              onAlterarPreco={alterarPrecoItem}   // ← novo
              onConcluir={() => setModalPagamento(true)}
              onCancelar={cancelarVenda}
            />
          )}
        </div>
      )}

      {/* ── FAB carrinho mobile/tablet ── */}
      {compact && venda && (
        <button
          onClick={() => setCarrinhoAberto(true)}
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            width: 64, height: 64, borderRadius: '50%',
            background: '#C8822A', color: '#fff', border: 'none',
            fontSize: '1.6rem', cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(200,130,42,0.45)',
            zIndex: 98, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          🛒
          {totalItens > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#EF4444', color: '#fff',
              borderRadius: '50%', width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700,
              border: '2px solid #FDF6EC',
            }}>
              {totalItens > 9 ? '9+' : totalItens}
            </span>
          )}
        </button>
      )}

      {/* ── Drawer carrinho mobile/tablet ── */}
      {compact && carrinhoAberto && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setCarrinhoAberto(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: isMobile ? '85vh' : '70vh',
            background: '#FFFBF5',
            borderRadius: '1.25rem 1.25rem 0 0',
            zIndex: 200,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
              <div style={{ width: 40, height: 4, background: '#E0C9A8', borderRadius: '999px' }} />
            </div>
            {/* Header do drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem 0.75rem', borderBottom: '1px solid #F0E4CC' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C1A0E', fontWeight: 700 }}>
                🛒 Carrinho
              </span>
              <button onClick={() => setCarrinhoAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#8B6F5E', padding: '4px 8px' }}>
                ✕
              </button>
            </div>
            {/* Conteúdo do carrinho */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {venda && (
                <Carrinho
                  venda={venda}
                  onRemover={removerItem}
                  onAlterarQtd={alterarQtd}
                  onAlterarPreco={alterarPrecoItem}   // ← novo
                  onConcluir={() => { setCarrinhoAberto(false); setModalPagamento(true); }}
                  onCancelar={cancelarVenda}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal pagamento */}
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