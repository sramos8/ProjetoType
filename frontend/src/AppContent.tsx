import { useState, useEffect, useCallback } from 'react';
import type { Produto, Estatisticas } from './types';
import { CATEGORIAS } from './types';
import { produtoService } from './services/api';
import { Modal } from './components/Modal';
import { ProdutoForm } from './components/ProdutoForm';
import { ProdutoCard } from './components/ProdutoCard';
import { PDV } from './pages/PDV';
import { Historico } from './pages/Historico';
import { Relatorio } from './pages/Relatorio';
import { Home } from './pages/Home';
import { CadastroUsuario } from './pages/CadastroUsuario';
import { useAuth } from './contexts/AuthContext';

type Tab = 'home' | 'produtos' | 'pdv' | 'historico' | 'relatorio' | 'usuarios';

export default function AppContent() {
  const { usuario, logout } = useAuth();

  const [aba, setAba] = useState<Tab>('home');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | undefined>();
  const [confirmarDelete, setConfirmarDelete] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [res, statsRes] = await Promise.all([
        produtoService.listar({ busca: busca || undefined, categoria: filtroCategoria || undefined }),
        produtoService.stats(),
      ]);
      setProdutos(res.data);
      setStats(statsRes);
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroCategoria]);

  useEffect(() => {
    if (aba === 'produtos') carregar();
  }, [carregar, aba]);

  const handleSalvar = async (dto: Parameters<typeof produtoService.criar>[0]) => {
    if (produtoEditando) await produtoService.atualizar(produtoEditando.id, dto);
    else await produtoService.criar(dto);
    setModalAberto(false);
    setProdutoEditando(undefined);
    await carregar();
  };

  const handleDeletar = async (id: string) => {
    await produtoService.deletar(id);
    setConfirmarDelete(null);
    await carregar();
  };

  // Guards sem hooks depois deles
  if (aba === 'home') return <Home onNavegar={setAba} role={usuario?.role} />;
  if (aba === 'usuarios') return <CadastroUsuario onVoltar={() => setAba('home')} />;

  const ABAS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'pdv',       label: 'PDV',       emoji: '🛒' },
    { id: 'historico', label: 'Histórico', emoji: '📋' },
    { id: 'relatorio', label: 'Relatório', emoji: '📊' },
    { id: 'produtos',  label: 'Produtos',  emoji: '📦' },
    ...(usuario?.role === 'admin'
      ? [{ id: 'usuarios' as Tab, label: 'Usuários', emoji: '👥' }]
      : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6EC', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{ background: '#2C1A0E', borderBottom: '3px solid #C8822A' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 2rem',
          display: 'flex', alignItems: 'center', gap: '2rem',
        }}>
          <div onClick={() => setAba('home')} style={{ padding: '1rem 0', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#F5DEB3', fontWeight: 700 }}>
              🥐 Padaria
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
            {ABAS.map(a => (
              <button key={a.id} onClick={() => setAba(a.id)} style={{
                padding: '0.75rem 1.25rem',
                background: aba === a.id ? '#C8822A' : 'transparent',
                border: 'none',
                borderBottom: aba === a.id ? '3px solid #F5DEB3' : '3px solid transparent',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.88rem',
                color: aba === a.id ? '#fff' : '#A07850',
                fontWeight: aba === a.id ? 700 : 400,
                transition: 'all 0.15s',
                marginBottom: -3,
              }}>
                {a.emoji} {a.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {aba === 'produtos' && (
              <button
                onClick={() => { setProdutoEditando(undefined); setModalAberto(true); }}
                style={{
                  padding: '0.45rem 1rem', background: '#C8822A', color: '#fff',
                  border: 'none', borderRadius: '0.5rem',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.88rem',
                }}
              >
                + Novo Produto
              </button>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.75rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '999px',
            }}>
              <span>{usuario?.role === 'admin' ? '👑' : '👷'}</span>
              <span style={{ fontSize: '0.82rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif" }}>
                {usuario?.nome}
              </span>
            </div>
            <button onClick={logout} style={{
              padding: '0.45rem 1rem', background: 'transparent',
              border: '1px solid #5C3D2E', borderRadius: '0.5rem',
              color: '#A07850', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
            }}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {aba === 'pdv'       && <PDV />}
      {aba === 'historico' && <Historico />}
      {aba === 'relatorio' && <Relatorio />}

      {aba === 'produtos' && (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total de produtos', valor: stats.total, emoji: '📦' },
                { label: 'Disponíveis', valor: stats.disponiveis, emoji: '✅' },
                { label: 'Valor em estoque', valor: stats.valorEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), emoji: '💰' },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#FFFBF5', border: '1px solid #E8D5B0',
                  borderRadius: '0.75rem', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '0.9rem',
                }}>
                  <span style={{ fontSize: '1.75rem' }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#2C1A0E', fontWeight: 700 }}>
                      {s.valor}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8B6F5E', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <input
              style={{ padding: '0.7rem 1rem', border: '1.5px solid #E0C9A8', borderRadius: '0.6rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', background: '#FFFBF5', color: '#2C1A0E', outline: 'none' }}
              placeholder="🔍 Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['', ...CATEGORIAS.map(c => c.valor)].map(cat => {
                const info = CATEGORIAS.find(c => c.valor === cat);
                return (
                  <button key={cat} onClick={() => setFiltroCategoria(cat)} style={{
                    padding: '0.35rem 0.9rem',
                    background: filtroCategoria === cat ? '#C8822A' : '#FFFBF5',
                    border: `1.5px solid ${filtroCategoria === cat ? '#C8822A' : '#E0C9A8'}`,
                    borderRadius: '999px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                    color: filtroCategoria === cat ? '#fff' : '#7A5C4E',
                    fontWeight: filtroCategoria === cat ? 700 : 400,
                  }}>
                    {cat === '' ? 'Todos' : `${info?.emoji} ${info?.label}`}
                  </button>
                );
              })}
            </div>
          </div>

          {carregando
            ? <div style={{ textAlign: 'center', padding: '3rem', color: '#8B6F5E' }}>Carregando...</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
                {produtos.map(p => (
                  <ProdutoCard
                    key={p.id} produto={p}
                    onEditar={prod => { setProdutoEditando(prod); setModalAberto(true); }}
                    onDeletar={id => setConfirmarDelete(id)}
                    onToggleDisponivel={async prod => {
                      await produtoService.atualizar(prod.id, { disponivel: !prod.disponivel });
                      await carregar();
                    }}
                  />
                ))}
              </div>
            )
          }
        </main>
      )}

      <Modal
        aberto={modalAberto}
        titulo={produtoEditando ? 'Editar Produto' : 'Novo Produto'}
        onFechar={() => { setModalAberto(false); setProdutoEditando(undefined); }}
      >
        <ProdutoForm
          produto={produtoEditando}
          onSalvar={handleSalvar}
          onCancelar={() => { setModalAberto(false); setProdutoEditando(undefined); }}
        />
      </Modal>

      <Modal aberto={confirmarDelete !== null} titulo="Remover produto" onFechar={() => setConfirmarDelete(null)}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#5C3D2E', marginTop: 0 }}>
          Deseja realmente remover este produto?
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button onClick={() => setConfirmarDelete(null)}
            style={{ flex: 1, padding: '0.7rem', background: 'transparent', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#8B6F5E' }}>
            Cancelar
          </button>
          <button onClick={() => confirmarDelete && handleDeletar(confirmarDelete)}
            style={{ flex: 1, padding: '0.7rem', background: '#C0392B', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
            Remover
          </button>
        </div>
      </Modal>
    </div>
  );
}