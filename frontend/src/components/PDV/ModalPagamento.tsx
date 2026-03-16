import React, { useState } from 'react';
import { Modal } from '../Modal';
import { FORMAS_PAGAMENTO } from '../../types/venda';

interface Props {
  aberto: boolean;
  valorTotal: number;
  onConfirmar: (formaPagamento: string, valorPago: number, obs: string) => Promise<void>;
  onFechar: () => void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ModalPagamento({ aberto, valorTotal, onConfirmar, onFechar }: Props) {
  const [forma, setForma] = useState('dinheiro');
  const [valorPago, setValorPago] = useState('');
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const pago = parseFloat(valorPago.replace(',', '.')) || 0;
  const troco = pago - valorTotal;

  const handleConfirmar = async () => {
    if (pago < valorTotal) { setErro('Valor pago é menor que o total.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onConfirmar(forma, pago, obs);
      setValorPago('');
      setObs('');
      setForma('dinheiro');
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao finalizar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal aberto={aberto} titulo="💰 Finalizar Venda" onFechar={onFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {erro && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.6rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif" }}>{erro}</div>}

        <div style={{ background: '#F5EDD8', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#7A5C4E', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.1em' }}>TOTAL A PAGAR</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#2C1A0E', fontWeight: 700 }}>{fmt(valorTotal)}</div>
        </div>

        <div>
          <label style={lbl}>Forma de Pagamento</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {FORMAS_PAGAMENTO.map(f => (
              <button key={f.valor} onClick={() => setForma(f.valor)}
                style={{ padding: '0.6rem', border: `2px solid ${forma === f.valor ? '#C8822A' : '#E0C9A8'}`, borderRadius: '0.5rem', background: forma === f.valor ? '#FFF3E0' : '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: forma === f.valor ? 700 : 400, color: forma === f.valor ? '#C8822A' : '#5C3D2E' }}>
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lbl}>Valor Recebido (R$)</label>
          <input
            style={{ padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', width: '100%', boxSizing: 'border-box', color: '#2C1A0E', background: '#FFFDF8' }}
            type="number" step="0.01" min={valorTotal}
            value={valorPago} onChange={e => { setValorPago(e.target.value); setErro(''); }}
            placeholder={valorTotal.toFixed(2)} autoFocus
          />
        </div>

        {pago >= valorTotal && forma === 'dinheiro' && (
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>TROCO</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#065F46', fontWeight: 700 }}>{fmt(troco)}</span>
          </div>
        )}

        <div>
          <label style={lbl}>Observação (opcional)</label>
          <input style={{ padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#2C1A0E', background: '#FFFDF8' }}
            value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: sem troco necessário..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button onClick={onFechar} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#8B6F5E' }}>Cancelar</button>
          <button onClick={handleConfirmar} disabled={salvando || pago < valorTotal}
            style={{ flex: 2, padding: '0.75rem', background: pago >= valorTotal ? '#C8822A' : '#D1D5DB', border: 'none', borderRadius: '0.5rem', cursor: pago >= valorTotal ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
            {salvando ? 'Finalizando...' : '✓ Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#7A5C4E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' };