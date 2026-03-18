import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

// ── Utilitários CPF ──────────────────────────────────────────
function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
function formatarCPF(valor: string): string {
  const c = limparCPF(valor).slice(0, 11);
  if (c.length <= 3) return c;
  if (c.length <= 6) return `${c.slice(0,3)}.${c.slice(3)}`;
  if (c.length <= 9) return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6)}`;
  return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9)}`;
}
function validarCPF(cpf: string): boolean {
  const c = limparCPF(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(c[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(c[10]);
}

// ── API pública (sem token) ──────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || '/api';
async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro desconhecido');
  return data;
}

export function Login() {
  const { login } = useAuth();
  const { isMobile } = useResponsive();
  const [tela, setTela] = useState<'login' | 'cadastro'>('login');

  // ── Estado login ─────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // ── Estado cadastro ──────────────────────────────────────
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [emailCad, setEmailCad] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('');
  const [senhaCad, setSenhaCad] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrarSenhaCad, setMostrarSenhaCad] = useState(false);
  const [cpfStatus, setCpfStatus] = useState<'idle' | 'digitando' | 'invalido' | 'livre' | 'cadastrado'>('idle');
  const [erroCad, setErroCad] = useState('');
  const [sucessoCad, setSucessoCad] = useState('');
  const [loadingCad, setLoadingCad] = useState(false);

  // ── Login submit ─────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) { setErroLogin('Preencha todos os campos'); return; }
    setLoadingLogin(true);
    setErroLogin('');
    try {
      await login(email, senha);
    } catch {
      setErroLogin('E-mail ou senha incorretos');
    } finally {
      setLoadingLogin(false);
    }
  };

  // ── CPF handler ──────────────────────────────────────────
  const handleCPF = (valor: string) => {
    const fmt = formatarCPF(valor);
    setCpf(fmt);
    const limpo = limparCPF(fmt);
    setErroCad('');
    if (limpo.length < 11) {
      setCpfStatus(limpo.length > 0 ? 'digitando' : 'idle');
      return;
    }
    if (!validarCPF(limpo)) { setCpfStatus('invalido'); return; }
    setCpfStatus('livre');
  };

  // ── Cadastro submit ──────────────────────────────────────
  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCad('');
    if (!nome.trim())                          { setErroCad('Nome obrigatório'); return; }
    if (!emailCad.trim())                      { setErroCad('E-mail obrigatório'); return; }
    if (!cpf || !validarCPF(limparCPF(cpf)))  { setErroCad('CPF inválido'); return; }
    if (cpfStatus === 'cadastrado')            { setErroCad('CPF já cadastrado'); return; }
    if (!senhaCad || senhaCad.length < 6)      { setErroCad('Senha deve ter no mínimo 6 caracteres'); return; }
    if (senhaCad !== confirmar)                { setErroCad('Senhas não coincidem'); return; }

    setLoadingCad(true);
    try {
      await apiPost('/auth/usuarios', {
        nome: nome.trim(), email: emailCad.trim(),
        cpf: limparCPF(cpf), senha: senhaCad,
        idade: idade ? Number(idade) : null,
        sexo: sexo || null, role: 'operador',
      });
      setSucessoCad('✅ Cadastro realizado! Faça login para continuar.');
      setTimeout(() => {
        setTela('login'); setSucessoCad('');
        setCpf(''); setNome(''); setEmailCad('');
        setIdade(''); setSexo(''); setSenhaCad(''); setConfirmar('');
        setCpfStatus('idle');
      }, 2500);
    } catch (err: unknown) {
      setErroCad((err as Error).message || 'Erro ao cadastrar');
    } finally {
      setLoadingCad(false);
    }
  };

  const cpfCorBorda = {
    idle: '#E0C9A8', digitando: '#FCD34D',
    invalido: '#EF4444', livre: '#10B981', cadastrado: '#EF4444',
  }[cpfStatus];

  // ── Estilos dinâmicos ─────────────────────────────────────
  const s = buildStyles(isMobile);

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoEmoji}>🥐</span>
          <h1 style={s.logoTitulo}>Padaria</h1>
          <p style={s.logoSub}>Sistema de Gestão</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button type="button"
            onClick={() => { setTela('login'); setErroLogin(''); }}
            style={{ ...s.tab, ...(tela === 'login' ? s.tabAtiva : {}) }}>
            🔑 Entrar
          </button>
          <button type="button"
            onClick={() => { setTela('cadastro'); setErroCad(''); }}
            style={{ ...s.tab, ...(tela === 'cadastro' ? s.tabAtiva : {}) }}>
            ✍️ Cadastrar
          </button>
        </div>

        {/* ════════ LOGIN ════════ */}
        {tela === 'login' && (
          <form onSubmit={handleLogin} style={s.form}>
            <h2 style={s.titulo}>Bem-vindo de volta</h2>

            {erroLogin && <div style={s.boxErro}>⚠️ {erroLogin}</div>}

            <div style={s.campo}>
              <label style={s.label}>E-mail</label>
              <input style={s.input} type="email" placeholder="admin@padaria.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>

            <div style={s.campo}>
              <label style={s.label}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...s.input, paddingRight: '2.5rem' }}
                  type={mostrarSenha ? 'text' : 'password'} placeholder="••••••••"
                  value={senha} onChange={e => setSenha(e.target.value)} />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} style={s.btnOlho}>
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loadingLogin}
              style={{ ...s.btnPrimario, opacity: loadingLogin ? 0.7 : 1 }}>
              {loadingLogin ? 'Entrando...' : 'Entrar →'}
            </button>

            <p style={s.hint}>Acesso padrão: <strong>admin@padaria.com</strong> / <strong>admin123</strong></p>
          </form>
        )}

        {/* ════════ CADASTRO ════════ */}
        {tela === 'cadastro' && (
          <form onSubmit={handleCadastro} style={s.form} noValidate>
            <h2 style={s.titulo}>Criar conta</h2>

            {erroCad    && <div style={s.boxErro}   >⚠️ {erroCad}</div>}
            {sucessoCad && <div style={s.boxSucesso}>{sucessoCad}</div>}

            {/* CPF */}
            <div style={s.campo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={s.label}>CPF *</label>
                {cpfStatus === 'invalido'   && <span style={{ ...s.cpfBadge, color: '#EF4444', borderColor: '#EF4444' }}>❌ Inválido</span>}
                {cpfStatus === 'livre'      && <span style={{ ...s.cpfBadge, color: '#10B981', borderColor: '#10B981' }}>✅ Disponível</span>}
                {cpfStatus === 'cadastrado' && <span style={{ ...s.cpfBadge, color: '#EF4444', borderColor: '#EF4444' }}>⚠️ Já cadastrado</span>}
                {cpfStatus === 'digitando'  && <span style={{ ...s.cpfBadge, color: '#F59E0B', borderColor: '#F59E0B' }}>✏️ Digitando...</span>}
              </div>
              <div style={{ height: 3, background: '#F0E4CC', borderRadius: 999, marginBottom: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999, background: cpfCorBorda,
                  width: `${Math.min((limparCPF(cpf).length / 11) * 100, 100)}%`,
                  transition: 'width 0.15s, background 0.2s',
                }} />
              </div>
              <input style={{ ...s.input, borderColor: cpfCorBorda }}
                placeholder="000.000.000-00" value={cpf}
                onChange={e => handleCPF(e.target.value)} maxLength={14} />
            </div>

            {/* Nome */}
            <div style={s.campo}>
              <label style={s.label}>Nome completo *</label>
              <input style={s.input} placeholder="João da Silva"
                value={nome} onChange={e => setNome(e.target.value)} />
            </div>

            {/* Idade + Sexo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '0.5rem' : '0.75rem' }}>
              <div style={s.campo}>
                <label style={s.label}>Idade</label>
                <input style={s.input} type="number" min="1" max="120"
                  placeholder="Ex: 30" value={idade} onChange={e => setIdade(e.target.value)} />
              </div>
              <div style={s.campo}>
                <label style={s.label}>Sexo</label>
                <select style={s.input} value={sexo} onChange={e => setSexo(e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* E-mail */}
            <div style={s.campo}>
              <label style={s.label}>E-mail *</label>
              <input style={s.input} type="email" placeholder="joao@email.com"
                value={emailCad} onChange={e => setEmailCad(e.target.value)} />
            </div>

            {/* Senha + Confirmar — empilhado no mobile */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '0.75rem' : '0.75rem',
            }}>
              <div style={s.campo}>
                <label style={s.label}>Senha *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{
                      ...s.input, paddingRight: '2.5rem',
                      borderColor: senhaCad && senhaCad.length < 6 ? '#EF4444' : '#E0C9A8',
                    }}
                    type={mostrarSenhaCad ? 'text' : 'password'}
                    placeholder="Mín. 6 caracteres"
                    value={senhaCad} onChange={e => setSenhaCad(e.target.value)}
                  />
                  <button type="button" onClick={() => setMostrarSenhaCad(v => !v)} style={s.btnOlho}>
                    {mostrarSenhaCad ? '🙈' : '👁️'}
                  </button>
                </div>
                {senhaCad && (
                  <div style={{ height: 3, background: '#F0E4CC', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999, transition: 'width 0.3s, background 0.3s',
                      width: senhaCad.length >= 10 ? '100%' : senhaCad.length >= 6 ? '60%' : '25%',
                      background: senhaCad.length >= 10 ? '#10B981' : senhaCad.length >= 6 ? '#F59E0B' : '#EF4444',
                    }} />
                  </div>
                )}
              </div>

              <div style={s.campo}>
                <label style={s.label}>Confirmar *</label>
                <input
                  style={{
                    ...s.input,
                    borderColor: confirmar && confirmar === senhaCad ? '#10B981'
                      : confirmar && confirmar !== senhaCad ? '#EF4444' : '#E0C9A8',
                  }}
                  type="password" placeholder="Repita a senha"
                  value={confirmar} onChange={e => setConfirmar(e.target.value)}
                />
                {confirmar && confirmar === senhaCad && (
                  <span style={{ fontSize: '0.7rem', color: '#10B981' }}>✓ Coincidem</span>
                )}
              </div>
            </div>

            <button type="submit"
              disabled={loadingCad || cpfStatus === 'cadastrado' || cpfStatus === 'invalido'}
              style={{
                ...s.btnPrimario, marginTop: '0.25rem',
                opacity: (loadingCad || cpfStatus === 'cadastrado' || cpfStatus === 'invalido') ? 0.55 : 1,
                cursor: (loadingCad || cpfStatus === 'cadastrado' || cpfStatus === 'invalido') ? 'not-allowed' : 'pointer',
              }}>
              {loadingCad ? '⏳ Cadastrando...' : '✓ Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Estilos responsivos ───────────────────────────────────────
function buildStyles(isMobile: boolean): Record<string, React.CSSProperties> {
  return {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2C1A0E 0%, #5C3520 50%, #2C1A0E 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: isMobile ? '0' : '1rem',        // sem padding lateral no mobile — card ocupa tudo
    },
    card: {
      background: '#FFFBF5',
      borderRadius: isMobile ? '0' : '1.25rem', // sem border radius no mobile
      width: '100%',
      maxWidth: isMobile ? '100%' : 440,
      minHeight: isMobile ? '100vh' : 'auto',   // ocupa tela toda no mobile
      boxShadow: isMobile ? 'none' : '0 32px 80px rgba(0,0,0,0.35)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    logo: {
      background: '#2C1A0E',
      padding: isMobile ? '1.25rem' : '1.75rem',
      textAlign: 'center',
      borderBottom: '3px solid #C8822A',
    },
    logoEmoji:  { fontSize: isMobile ? '2rem' : '2.5rem', display: 'block', marginBottom: '0.35rem' },
    logoTitulo: { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '1.4rem' : '1.6rem', color: '#F5DEB3', fontWeight: 900 },
    logoSub:    { margin: '0.2rem 0 0', fontSize: '0.72rem', color: '#A07850', textTransform: 'uppercase', letterSpacing: '0.12em' },
    tabs:       { display: 'flex', borderBottom: '1px solid #F0E4CC' },
    tab: {
      flex: 1, padding: isMobile ? '0.9rem 0.5rem' : '0.85rem',
      background: 'transparent', border: 'none',
      borderBottom: '3px solid transparent', cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: isMobile ? '0.95rem' : '0.88rem',
      color: '#A07850', fontWeight: 500,
      transition: 'all 0.15s', marginBottom: -1,
    },
    tabAtiva:   { color: '#C8822A', borderBottomColor: '#C8822A', fontWeight: 700, background: '#FFF7ED' },
    form: {
      padding: isMobile ? '1.25rem 1rem' : '1.5rem',
      display: 'flex', flexDirection: 'column',
      gap: isMobile ? '0.85rem' : '0.9rem',
      flex: 1,                                  // preenche o espaço no mobile
      overflowY: 'auto',                        // scroll interno se necessário
    },
    titulo:     { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '1.15rem' : '1.25rem', color: '#2C1A0E', textAlign: 'center' },
    campo:      { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    label:      { fontSize: '0.72rem', fontWeight: 700, color: '#7A5C4E', textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: {
      padding: isMobile ? '0.75rem 0.9rem' : '0.65rem 0.85rem',
      border: '1.5px solid #E0C9A8', borderRadius: '0.5rem',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: isMobile ? '1rem' : '0.92rem', // fonte maior no mobile — mais fácil digitar
      color: '#2C1A0E', background: '#FFFDF8',
      outline: 'none', width: '100%',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s',
    },
    btnOlho:    { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 },
    btnPrimario: {
      padding: isMobile ? '0.95rem' : '0.85rem',
      background: '#C8822A', color: '#fff', border: 'none',
      borderRadius: '0.6rem', fontFamily: "'DM Sans', sans-serif",
      fontWeight: 700, fontSize: isMobile ? '1.05rem' : '1rem',
      cursor: 'pointer', transition: 'opacity 0.15s',
    },
    boxErro:    { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', fontSize: '0.85rem', textAlign: 'center' },
    boxSucesso: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 },
    hint:       { margin: 0, textAlign: 'center', fontSize: '0.75rem', color: '#A07850', lineHeight: 1.5 },
    cpfBadge:   { fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid', fontFamily: "'DM Sans', sans-serif" },
  };
}