import React, { useState } from 'react';
import { Modal } from '../Modal';
import { FORMAS_PAGAMENTO } from '../../types/venda';
import type { Venda } from '../../types/venda';
import { imprimirCupom } from '../../utils/cupom';

interface Props {
  aberto: boolean;
  valorTotal: number;
  onConfirmar: (formaPagamento: string, valorPago: number, obs: string) => Promise<Venda | void>;
  onFechar: () => void;
}

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ModalPagamento({ aberto, valorTotal, onConfirmar, onFechar }: Props) {
  const [forma, setForma]         = useState('dinheiro');
  const [valorPago, setValorPago] = useState('');
  const [obs, setObs]             = useState('');
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState('');
  const [vendaPronta, setVendaPronta] = useState<Venda | null>(null);

  // Valor pago: se não digitou nada usa o total (para cartão/pix)
  const pago         = parseFloat(valorPago.replace(',', '.')) || 0;
  const valorEfetivo = valorPago === '' ? valorTotal : pago;
  const troco        = valorEfetivo - valorTotal;
  const podeFinalizar = valorPago === '' || pago >= valorTotal;

  const handleConfirmar = async () => {
    if (!podeFinalizar) { setErro('Valor pago é menor que o total.'); return; }
    setSalvando(true); setErro('');
    try {
      const resultado = await onConfirmar(forma, valorEfetivo, obs);
      if (resultado) setVendaPronta(resultado as Venda);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao finalizar');
    } finally {
      setSalvando(false);
    }
  };

  const handleFechar = () => {
    setVendaPronta(null);
    setValorPago('');
    setObs('');
    setForma('dinheiro');
    setErro('');
    onFechar();
  };

  // ── Tela de sucesso — pergunta sobre impressão ────────────
  if (vendaPronta) {
    return (
      <Modal aberto={aberto} titulo="✅ Venda Concluída" onFechar={handleFechar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Resumo */}
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total pago
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#065F46', fontWeight: 700 }}>
              {fmt(vendaPronta.valorPago ?? valorTotal)}
            </div>
            {vendaPronta.troco != null && vendaPronta.troco > 0 && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#047857', fontWeight: 700, marginTop: '0.25rem' }}>
                Troco: {fmt(vendaPronta.troco)}
              </div>
            )}
          </div>

          {/* Pergunta */}
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#C2410C', fontWeight: 700, marginBottom: '0.25rem' }}>
              🖨️ Deseja imprimir o cupom?
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', color: '#92400E' }}>
              Cupom não fiscal — Bematech i9
            </div>
          </div>

          {/* Botões de resposta */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleFechar}
              style={{
                flex: 1, padding: '0.85rem',
                background: 'transparent',
                border: '1.5px solid #E0C9A8',
                borderRadius: '0.6rem', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem', color: '#8B6F5E',
                fontWeight: 600,
              }}
            >
              Não, obrigado
            </button>
            <button
              onClick={() => { imprimirCupom(vendaPronta); handleFechar(); }}
              style={{
                flex: 2, padding: '0.85rem',
                background: '#2C1A0E', color: '#F5DEB3',
                border: 'none', borderRadius: '0.6rem', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.95rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              🖨️ Sim, imprimir
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Tela de pagamento ─────────────────────────────────────
  return (
    <Modal aberto={aberto} titulo="💰 Finalizar Venda" onFechar={handleFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {erro && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.6rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif" }}>
            {erro}
          </div>
        )}

        {/* Total */}
        <div style={{ background: '#F5EDD8', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#7A5C4E', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: '0.1em' }}>
            TOTAL A PAGAR
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: '#2C1A0E', fontWeight: 700 }}>
            {fmt(valorTotal)}
          </div>
        </div>

        {/* Forma de pagamento */}
        <div>
          <label style={lbl}>Forma de Pagamento</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {FORMAS_PAGAMENTO.map(f => (
              <button
                key={f.valor}
                onClick={() => { setForma(f.valor); setErro(''); }}
                style={{
                  padding: '0.65rem',
                  border: `2px solid ${forma === f.valor ? '#C8822A' : '#E0C9A8'}`,
                  borderRadius: '0.5rem',
                  background: forma === f.valor ? '#FFF3E0' : '#fff',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.88rem',
                  fontWeight: forma === f.valor ? 700 : 400,
                  color: forma === f.valor ? '#C8822A' : '#5C3D2E',
                  transition: 'all 0.15s',
                }}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Valor recebido — só aparece para dinheiro */}
        {forma === 'dinheiro' && (
          <div>
            <label style={lbl}>
              Valor Recebido (R$)
              <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', color: '#A07850', marginLeft: '0.4rem' }}>
                (deixe em branco para exato)
              </span>
            </label>
            <input
              style={{ padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', width: '100%', boxSizing: 'border-box', color: '#2C1A0E', background: '#FFFDF8', outline: 'none' }}
              type="number"
              step="0.01"
              min={0}
              value={valorPago}
              onChange={e => { setValorPago(e.target.value); setErro(''); }}
              placeholder={valorTotal.toFixed(2)}
              autoFocus
            />
          </div>
        )}

        {/* Troco — só para dinheiro com valor digitado acima do total */}
        {forma === 'dinheiro' && valorPago !== '' && pago >= valorTotal && (
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>
              TROCO
            </span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#065F46', fontWeight: 700 }}>
              {fmt(troco)}
            </span>
          </div>
        )}

        {/* Sem troco — dinheiro exato */}
        {forma === 'dinheiro' && valorPago === '' && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem' }}>💵</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
              Pagamento exato — sem troco
            </span>
          </div>
        )}

        {/* Confirmação para cartão/pix */}
        {forma !== 'dinheiro' && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BAE6FD', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#0369A1', fontWeight: 600 }}>
              {FORMAS_PAGAMENTO.find(f => f.valor === forma)?.emoji} Valor a cobrar
            </span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#0369A1', fontWeight: 700 }}>
              {fmt(valorTotal)}
            </span>
          </div>
        )}

        {/* Observação */}
        <div>
          <label style={lbl}>Observação (opcional)</label>
          <input
            style={{ padding: '0.65rem 0.85rem', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#2C1A0E', background: '#FFFDF8', outline: 'none' }}
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ex: sem troco necessário..."
          />
        </div>

        {/* Erro de valor */}
        {forma === 'dinheiro' && valorPago !== '' && pago < valorTotal && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            ⚠️ Valor insuficiente — faltam {fmt(valorTotal - pago)}
          </div>
        )}

        {/* Botões */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button
            onClick={handleFechar}
            style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1.5px solid #E0C9A8', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#8B6F5E' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={salvando || !podeFinalizar}
            style={{
              flex: 2, padding: '0.75rem',
              background: podeFinalizar ? '#C8822A' : '#D1D5DB',
              border: 'none', borderRadius: '0.5rem',
              cursor: podeFinalizar ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700, color: '#fff', fontSize: '0.95rem',
              transition: 'background 0.2s',
            }}
          >
            {salvando ? '⏳ Finalizando...' : `✓ Confirmar — ${fmt(valorTotal)}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem',
  fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
  color: '#7A5C4E', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: '0.4rem',
};