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
  criadoEm: string;
  concluidoEm: string | null;
}

export interface CriarItemDTO {
  produtoId: string;
  quantidade: number;
}

export interface ConcluirVendaDTO {
  formaPagamento: FormaPagamento;
  valorPago: number;
  observacao?: string;
}