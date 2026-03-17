import React, { useState, useRef } from 'react';
import { api } from '../services/authService';
import { formatarCPF, validarCPF, limparCPF } from '../utils/cpf';

interface FormData {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  confirmarSenha: string;
  idade: string;
  sexo: string;
  role: string;
}

const vazio: FormData = {
  nome: '', email: '', cpf: '', senha: '',
  confirmarSenha: '', idade: '', sexo: '', role: 'operador',
};

interface Props {
  onVoltar: () => void;
}

export function CadastroUsuario({ onVoltar }: Props) {
  const [form, setForm] = useState<FormData>(vazio);
  const [erros, setErros] = useState<Partial<FormData>>({});
  const [cpfStatus, setCpfStatus] = useState<'idle' | 'buscando' | 'encontrado' | 'livre' | 'invalido'>('idle');
  const [sucesso, setSucesso] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);
  const cpfTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (campo: keyof FormData, valor: string) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setErros(e => ({ ...e, [campo]: '' }));
  };

  // ── Ao digitar CPF — busca automática ──────────────────────
  const handleCPF = (valor: string) => {
    const formatado = formatarCPF(valor);
    set('cpf', formatado);
    const limpo = limparCPF(formatado);

    if (cpfTimer.current) clearTimeout(cpfTimer.current);

    if (limpo.length < 11) {
      setCpfStatus('idle');
      return;
    }

    if (!validarCPF(limpo)) {
      setCpfStatus('invalido');
      setErros(e => ({ ...e, cpf: 'CPF inválido' }));
      return;
    }

    // Buscar no backend
    setCpfStatus('buscando');
    cpfTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/cpf/${limpo}`);
        const u = data.data;
        // Preencher campos automaticamente
        setForm(f => ({
          ...f,
          nome:  u.nome  || f.nome,
          idade: u.idade ? String(u.idade) : f.idade,
          sexo:  u.sexo  || f.sexo,
          email: u.email || f.email,
        }));
        setCpfStatus('encontrado');
        setErros(e => ({ ...e, cpf: 'CPF já cadastrado no sistema' }));
      } catch (err: unknown) {
        const status = (err as { response?: { status: number } }).response?.status;
        if (status === 404) {
          setCpfStatus('livre');
          setErros(e => ({ ...e, cpf: '' }));
        } else {
          setCpfStatus('invalido');
        }
      }
    }, 600);
  };

  // ── Validação ──────────────────────────────────────────────
  const validar = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.nome.trim())  e.nome  = 'Nome obrigatório';
    if (!form.email.trim()) e.email = 'Email obrigatório';
    if (!form.cpf.trim())   e.cpf   = 'CPF obrigatório';
    else if (!validarCPF(limparCPF(form.cpf))) e.cpf = 'CPF inválido';
    if (cpfStatus === 'encontrado') e.cpf = 'CPF já cadastrado';
    if (!form.senha) e.senha = 'Senha obrigatória';
    else if (form.senha.length < 6) e.senha = 'Mínimo 6 caracteres';
    if (form.senha !== form.confirmarSenha) e.confirmarSenha = 'Senhas não coincidem';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    setErroGeral('');
    try {
      await api.post('/auth/usuarios', {
        nome:  form.nome,
        email: form.email,
        cpf:   limparCPF(form.cpf),
        senha: form.senha,
        idade: form.idade ? Number(form.idade) : null,
        sexo:  form.sexo  || null,
        role:  form.role,
      });
      setSucesso(`Usuário ${form.nome} cadastrado com sucesso!`);
      setForm(vazio);
      setCpfStatus('idle');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { erro?: string } } }).response?.data?.erro;
      setErroGeral(msg || 'Erro ao cadastrar usuário');
    } finally {
      setSalvando(false);
    }
  };

  const cpfIndicador = {
    idle:       { cor: '#E0C9A8', texto: '',                          emoji: '' },
    buscando:   { cor: '#FCD34D', texto: 'Verificando CPF...',        emoji: '⏳' },
    encontrado: { cor: '#EF4444', texto: 'CPF já cadastrado',         emoji: '❌' },
    livre:      { cor: '#10B981', texto: 'CPF disponível',            emoji: '✅' },
    invalido:   { cor: '#EF4444', texto: 'CPF inválido',              emoji: '⚠️' },
  }[cpfStatus];

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <button onClick={onVoltar} style={s.btnVoltar}>← Voltar</button>
          <h2 style={s.titulo}>👤 Cadastrar Usuário</h2>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>

          {sucesso && <div style={s.sucesso}>✅ {sucesso}</div>}
          {erroGeral && <div style={s.erro}>⚠️ {erroGeral}</div>}

          {/* CPF — campo principal com busca automática */}
          <div style={s.campo}>
            <label style={s.label}>
              CPF *
              {cpfStatus !== 'idle' && (
                <span style={{ ...s.cpfTag, borderColor: cpfIndicador.cor, color: cpfIndicador.cor }}>
                  {cpfIndicador.emoji} {cpfIndicador.texto}
                </span>
              )}
            </label>
            <input
              style={{ ...s.input, borderColor: erros.cpf ? '#EF4444' : cpfIndicador.cor }}
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={e => handleCPF(e.target.value)}
              maxLength={14}
            />
            {erros.cpf && <span style={s.erroField}>{erros.cpf}</span>}
            {cpfStatus === 'encontrado' && (
              <div style={s.cpfInfo}>
                ℹ️ Dados preenchidos automaticamente a partir do CPF encontrado
              </div>
            )}
          </div>

          {/* Nome */}
          <div style={s.campo}>
            <label style={s.label}>Nome completo *</label>
            <input
              style={{ ...s.input, borderColor: erros.nome ? '#EF4444' : '#E0C9A8' }}
              placeholder="João da Silva"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
            {erros.nome && <span style={s.erroField}>{erros.nome}</span>}
          </div>

          {/* Idade e Sexo lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={s.campo}>
              <label style={s.label}>Idade</label>
              <input
                style={s.input}
                type="number" min="1" max="120"
                placeholder="Ex: 30"
                value={form.idade}
                onChange={e => set('idade', e.target.value)}
              />
            </div>
            <div style={s.campo}>
              <label style={s.label}>Sexo</label>
              <select
                style={s.input}
                value={form.sexo}
                onChange={e => set('sexo', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div style={s.campo}>
            <label style={s.label}>E-mail *</label>
            <input
              style={{ ...s.input, borderColor: erros.email ? '#EF4444' : '#E0C9A8' }}
              type="email"
              placeholder="joao@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
            {erros.email && <span style={s.erroField}>{erros.email}</span>}
          </div>

          {/* Senha e confirmar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={s.campo}>
              <label style={s.label}>Senha *</label>
              <input
                style={{ ...s.input, borderColor: erros.senha ? '#EF4444' : '#E0C9A8' }}
                type="password" placeholder="Mínimo 6 caracteres"
                value={form.senha}
                onChange={e => set('senha', e.target.value)}
              />
              {erros.senha && <span style={s.erroField}>{erros.senha}</span>}
            </div>
            <div style={s.campo}>
              <label style={s.label}>Confirmar senha *</label>
              <input
                style={{ ...s.input, borderColor: erros.confirmarSenha ? '#EF4444' : '#E0C9A8' }}
                type="password" placeholder="Repita a senha"
                value={form.confirmarSenha}
                onChange={e => set('confirmarSenha', e.target.value)}
              />
              {erros.confirmarSenha && <span style={s.erroField}>{erros.confirmarSenha}</span>}
            </div>
          </div>

          {/* Perfil */}
          <div style={s.campo}>
            <label style={s.label}>Perfil de acesso</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { val: 'operador', label: '👷 Operador', desc: 'PDV e consultas' },
                { val: 'admin',    label: '👑 Admin',    desc: 'Acesso total' },
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => set('role', p.val)}
                  style={{
                    flex: 1, padding: '0.75rem',
                    border: `2px solid ${form.role === p.val ? '#C8822A' : '#E0C9A8'}`,
                    borderRadius: '0.5rem',
                    background: form.role === p.val ? '#FFF3E0' : '#FFFBF5',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.88rem', color: form.role === p.val ? '#C8822A' : '#374151' }}>
                    {p.label}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#8B6F5E', marginTop: 2 }}>
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setForm(vazio)} style={s.btnSecundario}>
              Limpar
            </button>
            <button
              type="submit"
              disabled={salvando || cpfStatus === 'encontrado' || cpfStatus === 'invalido'}
              style={{
                ...s.btnPrimario,
                opacity: (salvando || cpfStatus === 'encontrado' || cpfStatus === 'invalido') ? 0.6 : 1,
                cursor: (salvando || cpfStatus === 'encontrado' || cpfStatus === 'invalido') ? 'not-allowed' : 'pointer',
              }}
            >
              {salvando ? 'Cadastrando...' : '✓ Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#FDF6EC', padding: '2rem', fontFamily: "'DM Sans', sans-serif", display: 'flex', justifyContent: 'center', alignItems: 'flex-start' },
  card: { background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '1rem', width: '100%', maxWidth: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F0E4CC', background: '#2C1A0E', borderRadius: '1rem 1rem 0 0' },
  btnVoltar: { background: 'transparent', border: '1px solid #5C3D2E', color: '#A07850', borderRadius: '0.4rem', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem' },
  titulo: { margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#F5DEB3' },
  form: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  campo: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { fontSize: '0.75rem', fontWeight: 700, color: '#7A5C4E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  input: { padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#2C1A0E', background: '#FFFDF8', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  erroField: { fontSize: '0.75rem', color: '#EF4444', marginTop: '0.15rem' },
  cpfTag: { fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid', marginLeft: '0.4rem' },
  cpfInfo: { fontSize: '0.78rem', color: '#0EA5E9', background: '#EFF6FF', border: '1px solid #BAE6FD', borderRadius: '0.4rem', padding: '0.4rem 0.7rem', marginTop: '0.25rem' },
  sucesso: { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', fontSize: '0.875rem' },
  erro: { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', fontSize: '0.875rem' },
  btnPrimario: { flex: 2, padding: '0.75rem', background: '#C8822A', color: '#fff', border: 'none', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.95rem' },
  btnSecundario: { flex: 1, padding: '0.75rem', background: 'transparent', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#8B6F5E' },
};