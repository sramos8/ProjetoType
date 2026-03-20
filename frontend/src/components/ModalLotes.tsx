import React, { useState, useEffect } from 'react';
import type { Produto } from '../types';
import type { Lote } from '../types/lote';
import { loteService } from '../services/loteService';
import { Modal } from './Modal';
import { ModalCamera } from './PDV/ModalCamera';

interface Props {
  produto: Produto | null;
  onFechar: () => void;
  onAtualizar: () => void;
}

const fmtData     = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
const fmtDataHora = (d: string) => new Date(d).toLocaleString('pt-BR');

function diasParaVencer(dataValidade: string): number {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const val  = new Date(dataValidade + 'T00:00:00');
  return Math.ceil((val.getTime() - hoje.getTime()) / 86400000);
}

function corValidade(dataValidade: string | null) {
  if (!dataValidade) return { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB', label: 'Sem validade' };
  const dias = diasParaVencer(dataValidade);
  if (dias < 0)  return { bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5', label: `Vencido há ${Math.abs(dias)}d` };
  if (dias <= 3) return { bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5', label: `Vence em ${dias}d ⚠️` };
  if (dias <= 7) return { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', label: `Vence em ${dias}d` };
  return { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', label: `${dias} dias` };
}

export function ModalLotes({ produto, onFechar, onAtualizar }: Props) {
  const [lotes, setLotes]           = useState<Lote[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [removendo, setRemovendo]   = useState<string | null>(null);
  const [cameraAberta, setCameraAberta] = useState(false);

  // Form novo lote
  const [qtd, setQtd]           = useState('');
  const [validade, setValidade] = useState('');
  const [barcode, setBarcode]   = useState('');
  const [obs, setObs]           = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');
  const [sucesso, setSucesso]   = useState('');

  const carregar = async () => {
    if (!produto) return;
    setCarregando(true);
    try {
      const data = await loteService.listar(produto.id);
      setLotes(data);
    } finally { setCarregando(false); }
  };

  useEffect(() => { carregar(); }, [produto]);

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto) return;
    if (!qtd || Number(qtd) <= 0) { setErro('Informe a quantidade'); return; }
    setSalvando(true); setErro('');
    try {
      await loteService.adicionar(produto.id, {
        quantidade:   Number(qtd),
        dataValidade: validade  || null,
        codigoBarras: barcode.trim() || null,
        observacao:   obs,
      });
      setSucesso(`✅ ${qtd} unidades adicionadas ao estoque`);
      setQtd(''); setValidade(''); setBarcode(''); setObs('');
      await carregar();
      onAtualizar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (e: unknown) {
      setErro((e as Error).message || 'Erro ao adicionar lote');
    } finally { setSalvando(false); }
  };

  const handleRemover = async (loteId: string) => {
    if (!produto) return;
    setRemovendo(loteId);
    try {
      await loteService.remover(produto.id, loteId);
      await carregar();
      onAtualizar();
    } finally { setRemovendo(null); }
  };

  if (!produto) return null;

  return (
    <>
      <Modal aberto={!!produto} titulo={`📦 Lotes — ${produto.nome}`} onFechar={onFechar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Resumo do estoque */}
          <div style={{ background: '#F5EDD8', borderRadius: '0.65rem', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={sSecLabel}>Estoque atual</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#2C1A0E', fontWeight: 700 }}>
                {produto.estoque} un.
              </div>
            </div>
            {produto.dataValidade && (
              <div style={{ textAlign: 'right' }}>
                <div style={sSecLabel}>Próx. vencimento</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', color: '#C2410C', fontWeight: 700 }}>
                  {fmtData(produto.dataValidade)}
                </div>
              </div>
            )}
          </div>

          {/* Form novo lote */}
          <div style={{ background: '#FFFBF5', border: '1px solid #E8D5B0', borderRadius: '0.75rem', padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.85rem', fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#2C1A0E' }}>
              ➕ Adicionar nova entrada
            </h3>

            {erro    && <div style={sErro}>{erro}</div>}
            {sucesso && <div style={sSucesso}>{sucesso}</div>}

            <form onSubmit={handleAdicionar} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Quantidade + Validade */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={sLabel}>Quantidade *</label>
                  <input
                    style={sInput} type="number" min="1" placeholder="Ex: 50"
                    value={qtd} onChange={e => setQtd(e.target.value)} autoFocus
                  />
                </div>
                <div>
                  <label style={sLabel}>Data de Validade</label>
                  <input
                    style={sInput} type="date"
                    value={validade} onChange={e => setValidade(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview validade */}
              {validade && (
                <div style={{
                  background: corValidade(validade).bg,
                  border: `1px solid ${corValidade(validade).border}`,
                  color: corValidade(validade).color,
                  borderRadius: '0.4rem', padding: '0.4rem 0.75rem',
                  fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                }}>
                  📅 {fmtData(validade)} · {corValidade(validade).label}
                </div>
              )}

              {/* Código de barras */}
              <div>
                <label style={sLabel}>
                  Código de Barras do Lote
                  <span style={{ fontSize: '0.65rem', color: '#A07850', fontWeight: 400, marginLeft: '0.3rem' }}>
                    (use o leitor ou câmera)
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      style={{ ...sInput, paddingRight: '2.5rem' }}
                      placeholder="Ex: 2000100004203"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                    />
                    <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', opacity: 0.4, pointerEvents: 'none' }}>
                      📷
                    </span>
                  </div>

                  {/* Botão câmera */}
                  <button
                    type="button"
                    onClick={() => setCameraAberta(true)}
                    title="Escanear com câmera"
                    style={{
                      padding: '0 0.85rem', background: '#EFF6FF',
                      border: '1.5px solid #BAE6FD', borderRadius: '0.5rem',
                      cursor: 'pointer', color: '#0EA5E9',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                      fontSize: '0.82rem', whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    📱 Câmera
                  </button>

                  {/* Limpar */}
                  {barcode && (
                    <button
                      type="button"
                      onClick={() => setBarcode('')}
                      style={{ padding: '0 0.65rem', background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '0.5rem', cursor: 'pointer', color: '#B91C1C', flexShrink: 0, fontSize: '0.85rem' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Preview do código lido */}
                {barcode && (
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.75rem', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>✅</span>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.8rem', color: '#065F46', fontWeight: 700 }}>
                      {barcode}
                    </span>
                  </div>
                )}
              </div>

              {/* Observação */}
              <div>
                <label style={sLabel}>Observação (opcional)</label>
                <input
                  style={sInput} placeholder="Ex: Lote A, fornecedor X..."
                  value={obs} onChange={e => setObs(e.target.value)}
                />
              </div>

              <button type="submit" disabled={salvando} style={{
                padding: '0.7rem', background: '#C8822A', color: '#fff',
                border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.9rem',
                opacity: salvando ? 0.7 : 1,
              }}>
                {salvando ? 'Adicionando...' : '✓ Adicionar ao Estoque'}
              </button>
            </form>
          </div>

          {/* Lista de lotes */}
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: '#2C1A0E' }}>
              📋 Histórico de Lotes
            </h3>

            {carregando ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#8B6F5E', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                Carregando...
              </div>
            ) : lotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#A07850', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem' }}>
                Nenhum lote registrado ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                {lotes.map(lote => {
                  const cor = corValidade(lote.dataValidade);
                  return (
                    <div key={lote.id} style={{
                      background: cor.bg, border: `1px solid ${cor.border}`,
                      borderRadius: '0.6rem', padding: '0.75rem 0.9rem',
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    }}>

                      {/* Quantidade */}
                      <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 44 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C1A0E', fontWeight: 700 }}>
                          {lote.quantidade}
                        </div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.65rem', color: '#8B6F5E' }}>un.</div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Validade */}
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: cor.color, fontWeight: 700 }}>
                          {lote.dataValidade
                            ? `📅 ${fmtData(lote.dataValidade)} · ${cor.label}`
                            : '📅 Sem validade'
                          }
                        </div>

                        {/* Código de barras */}
                        {lote.codigoBarras && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.72rem' }}>📷</span>
                            <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.72rem', color: '#374151', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '1px 6px' }}>
                              {lote.codigoBarras}
                            </span>
                          </div>
                        )}

                        {/* Criado em / operador / obs */}
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#A07850', marginTop: '0.2rem' }}>
                          {fmtDataHora(lote.criadoEm)}
                          {lote.nomeOperador && ` · 👷 ${lote.nomeOperador}`}
                          {lote.observacao   && ` · ${lote.observacao}`}
                        </div>
                      </div>

                      {/* Remover */}
                      <button
                        onClick={() => handleRemover(lote.id)}
                        disabled={removendo === lote.id}
                        title="Descartar lote"
                        style={{
                          background: '#FEE2E2', border: '1px solid #FCA5A5',
                          color: '#B91C1C', borderRadius: '0.4rem',
                          padding: '0.3rem 0.6rem', cursor: 'pointer',
                          fontSize: '0.78rem', fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                          opacity: removendo === lote.id ? 0.6 : 1,
                        }}
                      >
                        {removendo === lote.id ? '...' : '🗑'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal câmera — fora do Modal principal */}
      <ModalCamera
        aberto={cameraAberta}
        onLeitura={(codigo) => {
          setBarcode(codigo);
          setCameraAberta(false);
        }}
        onFechar={() => setCameraAberta(false)}
      />
    </>
  );
}

const sLabel:    React.CSSProperties = { display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#7A5C4E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' };
const sSecLabel: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', color: '#A07850', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' };
const sInput:    React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', color: '#2C1A0E', background: '#FFFDF8', outline: 'none' };
const sErro:     React.CSSProperties = { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", marginBottom: '0.5rem' };
const sSucesso:  React.CSSProperties = { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif", marginBottom: '0.5rem', fontWeight: 600 };