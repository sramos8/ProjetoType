export type StatusVenda = 'aberta' | 'concluida' | 'cancelada';
export type FormaPagamento = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';

export interface ItemVenda {
  id: string;
  vendaId: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  precoOriginal?: number; // ← novo campo para armazenar o preço original do item, caso seja alterado
}

export interface Venda {
  id: string;
  status: StatusVenda;
  formaPagamento: FormaPagamento | null;
  valorTotal: number;
  valorPago: number | null;
  troco: number | null;
  observacao: string;
  itens: ItemVenda[];
  usuarioId: string | null;    // ← adicionar
  usuarioNome: string | null;  // ← adicionar
  criadoEm: string;
  concluidoEm: string | null;
}

// Adicione ao tipo Relatorio:
export interface Relatorio {
  resumo: {
    totalVendas: number;
    faturamentoBruto: number;
    ticketMedio: number;
    canceladas: number;
  };
  porFormaPagamento: { formaPagamento: string; qtd: number; total: number }[];
  produtosMaisVendidos: { produtoId: string; nomeProduto: string; totalQtd: number; totalValor: number }[];
  porOperador: { operador: string; totalVendas: number; totalFaturado: number }[];
  detalheVendas: {
    vendaId: string;
    dataVenda: string;
    operador: string;
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    formaPagamento: string;
    valorTotal: number;
  }[];
  vendasPorDia: { dia: string; qtd: number; total: number }[];
}

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; label: string; emoji: string }[] = [
  { valor: 'dinheiro',        label: 'Dinheiro',       emoji: '💵' },
  { valor: 'cartao_debito',   label: 'Débito',         emoji: '💳' },
  { valor: 'cartao_credito',  label: 'Crédito',        emoji: '💳' },
  { valor: 'pix',             label: 'PIX',            emoji: '📱' },
];