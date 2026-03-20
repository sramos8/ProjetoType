import type { Venda } from '../types/venda';
import { FORMAS_PAGAMENTO } from '../types/venda';

interface ConfigCupom {
  nomePadaria: string;
  cnpj: string;
  mensagemFinal: string;
}

const CONFIG: ConfigCupom = {
  nomePadaria:    'Padaria Sua Empresa',   // ← altere
  cnpj:           '00.000.000/0001-00',    // ← altere
  mensagemFinal:  'Obrigado pela preferência! Volte sempre! 🥐',
};

const fmt     = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR');

function linha(char = '-', qtd = 42): string {
  return char.repeat(qtd);
}

function centralizar(texto: string, largura = 42): string {
  if (texto.length >= largura) return texto;
  const espacos = Math.floor((largura - texto.length) / 2);
  return ' '.repeat(espacos) + texto;
}

function linhaValor(desc: string, valor: string, largura = 42): string {
  const espaco = largura - desc.length - valor.length;
  return desc + ' '.repeat(Math.max(1, espaco)) + valor;
}

export function gerarCupomHTML(venda: Venda): string {
  const fp       = FORMAS_PAGAMENTO.find(f => f.valor === venda.formaPagamento);
  const agora    = new Date();
  const dataHora = agora.toLocaleString('pt-BR');

  const itensHTML = venda.itens.map(item => `
    <div class="item-nome">${item.nomeProduto}</div>
    <div class="item-calc">
      <span>${item.quantidade} x ${fmt(item.precoUnitario)}</span>
      <span>${fmt(item.subtotal)}</span>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Cupom #${venda.id.slice(0, 8).toUpperCase()}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          width: 80mm;
          padding: 4mm 3mm;
          background: #fff;
          color: #000;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .centro {
          text-align: center;
        }

        .nome-padaria {
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .cnpj {
          text-align: center;
          font-size: 10px;
          margin-bottom: 2px;
        }

        .nao-fiscal {
          text-align: center;
          font-size: 10px;
          font-weight: bold;
          border: 1px solid #000;
          padding: 2px 4px;
          margin: 4px auto;
          width: fit-content;
          letter-spacing: 1px;
        }

        .linha {
          border-top: 1px dashed #000;
          margin: 4px 0;
        }

        .linha-solida {
          border-top: 1px solid #000;
          margin: 4px 0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin: 1px 0;
        }

        .secao-titulo {
          font-weight: bold;
          font-size: 10px;
          text-transform: uppercase;
          margin: 3px 0 2px;
        }

        .item-nome {
          font-size: 11px;
          margin-top: 3px;
          font-weight: bold;
        }

        .item-calc {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #333;
          margin-bottom: 2px;
          padding-left: 4px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: bold;
          margin: 3px 0;
        }

        .pagamento-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin: 2px 0;
        }

        .troco-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: bold;
          margin: 2px 0;
        }

        .mensagem-final {
          text-align: center;
          font-size: 11px;
          margin: 6px 0 4px;
          font-style: italic;
        }

        .cupom-id {
          text-align: center;
          font-size: 9px;
          color: #555;
          margin-top: 3px;
        }

        @media print {
          body {
            width: 80mm;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>

      <!-- Cabeçalho -->
      <div class="nome-padaria">${CONFIG.nomePadaria}</div>
      <div class="cnpj">CNPJ: ${CONFIG.cnpj}</div>
      <div class="nao-fiscal">NÃO É DOCUMENTO FISCAL</div>

      <div class="linha"></div>

      <!-- Data e hora -->
      <div class="info-row">
        <span>Data/Hora:</span>
        <span>${dataHora}</span>
      </div>
      <div class="info-row">
        <span>Cupom Nº:</span>
        <span>${venda.id.slice(0, 8).toUpperCase()}</span>
      </div>
      ${venda.usuarioNome ? `
      <div class="info-row">
        <span>Operador:</span>
        <span>${venda.usuarioNome}</span>
      </div>` : ''}

      <div class="linha"></div>

      <!-- Itens -->
      <div class="secao-titulo">ITENS</div>
      ${itensHTML}

      <div class="linha-solida"></div>

      <!-- Total -->
      <div class="total-row">
        <span>TOTAL</span>
        <span>${fmt(venda.valorTotal)}</span>
      </div>

      <div class="linha"></div>

      <!-- Pagamento -->
      <div class="secao-titulo">PAGAMENTO</div>
      <div class="pagamento-row">
        <span>${fp?.emoji ?? ''} ${fp?.label ?? venda.formaPagamento ?? '—'}</span>
        <span>${fmt(venda.valorPago ?? venda.valorTotal)}</span>
      </div>
      ${venda.troco != null && venda.troco > 0 ? `
      <div class="troco-row">
        <span>TROCO</span>
        <span>${fmt(venda.troco)}</span>
      </div>` : ''}

      ${venda.observacao ? `
      <div class="linha"></div>
      <div class="info-row">
        <span>Obs: ${venda.observacao}</span>
      </div>` : ''}

      <div class="linha"></div>

      <!-- Mensagem final -->
      <div class="mensagem-final">${CONFIG.mensagemFinal}</div>

      <div class="linha"></div>

      <div class="cupom-id">ID: ${venda.id}</div>
      <div class="cupom-id">Emitido em ${dataHora}</div>

      <br><br>

    </body>
    </html>
  `;
}

export function imprimirCupom(venda: Venda): void {
  const html   = gerarCupomHTML(venda);
  const janela = window.open('', '_blank', 'width=320,height=600');
  if (!janela) {
    alert('Permita pop-ups para imprimir o cupom.');
    return;
  }
  janela.document.write(html);
  janela.document.close();
  janela.focus();

  // Aguarda carregar e imprime
  janela.onload = () => {
    setTimeout(() => {
      janela.print();
      janela.close();
    }, 300);
  };
}