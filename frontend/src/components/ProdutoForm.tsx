import React, { useState, useEffect } from 'react';
import type { Produto, CriarProdutoDTO } from '../types';
import { CATEGORIAS } from '../types';

interface ProdutoFormProps {
  produto?: Produto;
  onSalvar: (dto: CriarProdutoDTO) => Promise<void>;
  onCancelar: () => void;
}

const vazio: CriarProdutoDTO = {
  nome: '', categoria: 'pao', preco: 0,
  estoque: 0, descricao: '', disponivel: true,
};

export function ProdutoForm({ produto, onSalvar, onCancelar }: ProdutoFormProps) {
  const [form, setForm] = useState<CriarProdutoDTO>(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (produto) {
      const { id: _, criadoEm: __, atualizadoEm: ___, ...rest } = produto;
      setForm(rest);
    } else {
      setForm(vazio);
    }
  }, [produto]);

  const set = <K extends keyof CriarProdutoDTO>(k: K, v: CriarProdutoDTO[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (form.preco < 0) { setErro('Preço não pode ser negativo'); return; }
    setSalvando(true);
    try {
      await onSalvar(form);
    } catch {
      setErro('Erro ao salvar produto. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {erro && <div style={styles.erro}>{erro}</div>}

      <div style={styles.grupo}>
        <label style={styles.label}>Nome do produto *</label>
        <input style={styles.input} value={form.nome}
          onChange={e => set('nome', e.target.value)} placeholder="Ex: Pão de queijo" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={styles.grupo}>
          <label style={styles.label}>Categoria *</label>
          <select style={styles.input} value={form.categoria}
            onChange={e => set('categoria', e.target.value as CriarProdutoDTO['categoria'])}>
            {CATEGORIAS.map(c => (
              <option key={c.valor} value={c.valor}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div style={styles.grupo}>
          <label style={styles.label}>Preço (R$) *</label>
          <input style={styles.input} type="number" step="0.01" min="0"
            value={form.preco} onChange={e => set('preco', Number(e.target.value))} />
        </div>
      </div>

      <div style={styles.grupo}>
        <label style={styles.label}>Estoque (unidades)</label>
        <input style={styles.input} type="number" min="0"
          value={form.estoque} onChange={e => set('estoque', Number(e.target.value))} />
      </div>

      <div style={styles.grupo}>
        <label style={styles.label}>Descrição</label>
        <textarea style={{ ...styles.input, resize: 'vertical', minHeight: 72 }}
          value={form.descricao} onChange={e => set('descricao', e.target.value)}
          placeholder="Descreva o produto..." />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.disponivel}
          onChange={e => set('disponivel', e.target.checked)} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", color: '#5C3D2E', fontSize: '0.9rem' }}>
          Disponível para venda
        </span>
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancelar} style={styles.btnSecundario}>Cancelar</button>
        <button type="submit" disabled={salvando} style={styles.btnPrimario}>
          {salvando ? 'Salvando...' : produto ? '✓ Atualizar' : '+ Adicionar'}
        </button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grupo: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: '#7A5C4E', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#2C1A0E', background: '#FFFDF8', outline: 'none', transition: 'border-color 0.15s' },
  erro: { background: '#FFF0F0', border: '1px solid #FFB3B3', color: '#C0392B', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif" },
  btnPrimario: { flex: 1, padding: '0.75rem', background: '#C8822A', color: '#fff', border: 'none', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.15s' },
  btnSecundario: { padding: '0.75rem 1.25rem', background: 'transparent', color: '#8B6F5E', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer' },
};