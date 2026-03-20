export interface Lote {
  id: string;
  produtoId: string;
  nomeProduto?: string;
  quantidade: number;
  dataValidade: string | null;
  codigoBarras: string | null;  // ← novo
  observacao: string;
  criadoEm: string;
  nomeOperador: string | null;
}