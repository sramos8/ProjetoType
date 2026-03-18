export interface Produto {
  id: string;
  nome: string;
  categoria: 'pao' | 'bolo' | 'salgado' | 'doce' | 'bebida' | 'outro';
  preco: number;
  estoque: number;
  descricao: string;
  disponivel: boolean;
  codigoBarras: string | null;  // ← novo
  criadoEm: string;
  atualizadoEm: string;
}

export type CriarProdutoDTO = Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>;

export type AtualizarProdutoDTO = Partial<CriarProdutoDTO>;

export const CATEGORIAS = ['pao', 'bolo', 'salgado', 'doce', 'bebida', 'outro'] as const;