import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) { setErro('Preencha todos os campos'); return; }
    setProcessando(true);
    setErro('');
    try {
      await login(email, senha);
    } catch {
      setErro('Email ou senha incorretos');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoEmoji}>🥐</span>
          <h1 style={s.logoTitulo}>Padaria</h1>
          <p style={s.logoSub}>Sistema de Gestão</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={s.form}>
          <h2 style={s.titulo}>Entrar</h2>

          {erro && (
            <div style={s.erro}>
              ⚠️ {erro}
            </div>
          )}

          <div style={s.campo}>
            <label style={s.label}>E-mail</label>
            <input
              style={s.input}
              type="email"
              placeholder="admin@padaria.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div style={s.campo}>
            <label style={s.label}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...s.input, paddingRight: '3rem' }}
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                style={s.btnOlho}
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={processando}
            style={{ ...s.btnLogin, opacity: processando ? 0.7 : 1 }}
          >
            {processando ? 'Entrando...' : 'Entrar'}
          </button>

          <p style={s.hint}>
            Acesso padrão: <strong>admin@padaria.com</strong> / <strong>admin123</strong>
          </p>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #2C1A0E 0%, #5C3520 50%, #2C1A0E 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif", padding: '1rem',
  },
  card: {
    background: '#FFFBF5', borderRadius: '1.25rem',
    width: '100%', maxWidth: 400,
    boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  logo: {
    background: '#2C1A0E', padding: '2rem',
    textAlign: 'center', borderBottom: '3px solid #C8822A',
  },
  logoEmoji: { fontSize: '3rem', display: 'block', marginBottom: '0.5rem' },
  logoTitulo: {
    margin: 0, fontFamily: "'Playfair Display', serif",
    fontSize: '1.75rem', color: '#F5DEB3', fontWeight: 900,
  },
  logoSub: {
    margin: '0.25rem 0 0', fontSize: '0.75rem',
    color: '#A07850', textTransform: 'uppercase', letterSpacing: '0.12em',
  },
  form: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  titulo: {
    margin: 0, fontFamily: "'Playfair Display', serif",
    fontSize: '1.4rem', color: '#2C1A0E', textAlign: 'center',
  },
  erro: {
    background: '#FEF2F2', border: '1px solid #FCA5A5',
    color: '#B91C1C', borderRadius: '0.5rem',
    padding: '0.65rem 0.85rem', fontSize: '0.875rem', textAlign: 'center',
  },
  campo: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: {
    fontSize: '0.75rem', fontWeight: 700, color: '#7A5C4E',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  input: {
    padding: '0.7rem 0.9rem', border: '1.5px solid #E0C9A8',
    borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.95rem', color: '#2C1A0E', background: '#FFFDF8',
    outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  },
  btnOlho: {
    position: 'absolute', right: '0.75rem', top: '50%',
    transform: 'translateY(-50%)', background: 'none',
    border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0,
  },
  btnLogin: {
    padding: '0.85rem', background: '#C8822A', color: '#fff',
    border: 'none', borderRadius: '0.6rem', fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
    transition: 'background 0.15s', marginTop: '0.25rem',
  },
  hint: {
    margin: 0, textAlign: 'center', fontSize: '0.78rem',
    color: '#A07850', lineHeight: 1.5,
  },
};