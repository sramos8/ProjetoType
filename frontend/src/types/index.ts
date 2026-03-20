export type Categoria = 'pao' | 'bolo' | 'salgado' | 'doce' | 'bebida' | 'outro';

export interface Produto {
  id: string;
  nome: string;
  categoria: Categoria;
  preco: number;
  estoque: number;
  estoqueMinimo: number;   // ← novo
  descricao: string;
  disponivel: boolean;
  codigoBarras: string | null;
  dataValidade: string | null;  // ← novo
  precoSugerido?: number | null;
  pesoLido?: number | null;
  tipoBalanca?: 'preco' | 'peso' | 'desconhecido';
  ehCodigoBalanca?: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type CriarProdutoDTO = Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>;
export type AtualizarProdutoDTO = Partial<CriarProdutoDTO>;

export interface Estatisticas {
  total: number;
  disponiveis: number;
  valorEstoque: number;
  porCategoria: { categoria: string; qtd: number }[];
}

export const CATEGORIAS: { valor: Categoria; label: string; emoji: string }[] = [
  { valor: 'pao', label: 'Pão', emoji: '🍞' },
  { valor: 'bolo', label: 'Bolo', emoji: '🎂' },
  { valor: 'salgado', label: 'Salgado', emoji: '🥟' },
  { valor: 'doce', label: 'Doce', emoji: '🍬' },
  { valor: 'bebida', label: 'Bebida', emoji: '☕' },
  { valor: 'outro', label: 'Outro', emoji: '🛒' },
];