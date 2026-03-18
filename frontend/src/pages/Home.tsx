import { useResponsive } from '../hooks/useResponsive';

type Tab = 'home' | 'produtos' | 'pdv' | 'historico' | 'relatorio' | 'usuarios';

interface Props {
  onNavegar: (aba: Tab) => void;
  role?: string;
}

export function Home({ onNavegar, role }: Props) {
  const { isMobile, isTablet } = useResponsive();

  const cards = [
    { id: 'produtos'  as Tab, emoji: '📦', titulo: 'Produtos',     descricao: 'Cadastre e gerencie o estoque dos produtos',        cor: '#C8822A', bg: '#FFF7ED', border: '#FED7AA', tag: 'Gestão de estoque'   },
    { id: 'pdv'       as Tab, emoji: '🛒', titulo: 'PDV — Vendas', descricao: 'Frente de caixa para registrar vendas',              cor: '#0EA5E9', bg: '#EFF6FF', border: '#BAE6FD', tag: 'Ponto de venda'      },
    { id: 'historico' as Tab, emoji: '📋', titulo: 'Histórico',    descricao: 'Consulte todas as vendas realizadas',                cor: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', tag: 'Registro de vendas'  },
    { id: 'relatorio' as Tab, emoji: '📊', titulo: 'Relatório',    descricao: 'Faturamento e análises financeiras',                 cor: '#059669', bg: '#ECFDF5', border: '#A7F3D0', tag: 'Análise financeira'  },
    ...(role === 'admin' ? [{
      id: 'usuarios' as Tab, emoji: '👥', titulo: 'Usuários',
      descricao: 'Cadastre e gerencie os usuários do sistema',
      cor: '#DC2626', bg: '#FEF2F2', border: '#FECACA', tag: 'Administração',
    }] : []),
  ];

  const cols = isMobile ? 1 : isTablet ? 2 : cards.length <= 4 ? 2 : 3;

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6EC', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header style={{ background: '#2C1A0E', borderBottom: '3px solid #C8822A' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '1rem' : '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: isMobile ? '1.75rem' : '2rem' }}>🥐</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#F5DEB3', fontWeight: 700, lineHeight: 1 }}>Padaria</div>
              <div style={{ fontSize: '0.65rem', color: '#A07850', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Sistema de Gestão</div>
            </div>
          </div>
          {!isMobile && (
            <div style={{ fontSize: '0.82rem', color: '#7A5C4E', background: 'rgba(255,255,255,0.06)', padding: '0.45rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #3D2010 0%, #5C3520 100%)', padding: isMobile ? '2rem 1rem' : '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '1.6rem' : '2.4rem', color: '#F5DEB3', fontWeight: 900, margin: '0 0 0.6rem', letterSpacing: '-0.02em' }}>
          Bem-vindo! 👋
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? '0.88rem' : '1rem', color: '#A07850', margin: 0 }}>
          Escolha uma opção abaixo para começar
        </p>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? '0.85rem' : '1.25rem', marginBottom: '2rem' }}>
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => onNavegar(card.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: isMobile ? '1.1rem' : '1.5rem', background: card.bg, border: `2px solid ${card.border}`, borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.18s ease, box-shadow 0.18s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${card.cor}28`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, background: `${card.cor}18`, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '1.4rem' : '1.75rem', marginBottom: '0.85rem' }}>
                {card.emoji}
              </div>
              <h3 style={{ margin: '0 0 0.35rem', fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 700, color: card.cor }}>{card.titulo}</h3>
              <p style={{ margin: '0 0 0.85rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5, flex: 1 }}>{card.descricao}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: '0.65rem', borderTop: `1px solid ${card.border}` }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: card.cor, background: `${card.cor}12`, padding: '2px 8px', borderRadius: '999px' }}>{card.tag}</span>
                <span style={{ color: card.cor, fontSize: '1rem', fontWeight: 700 }}>→</span>
              </div>
            </button>
          ))}
        </div>

        {/* Fluxo */}
        <div style={{ background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '1rem', padding: isMobile ? '1.1rem' : '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', color: '#2C1A0E' }}>⚡ Fluxo recomendado</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { passo: '1', texto: 'Cadastre os produtos e defina o estoque inicial', destino: 'produtos' as Tab },
              { passo: '2', texto: 'Use o PDV para registrar cada venda do dia',       destino: 'pdv'      as Tab },
              { passo: '3', texto: 'Acompanhe o faturamento nos relatórios',           destino: 'relatorio' as Tab },
            ].map(d => (
              <div key={d.passo} onClick={() => onNavegar(d.destino)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.85rem', background: '#FDF6EC', borderRadius: '0.65rem', cursor: 'pointer', border: '1px solid #F0E4CC', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5EDD8'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FDF6EC'}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#C8822A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{d.passo}</div>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#5C3D2E', lineHeight: 1.5 }}>{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}