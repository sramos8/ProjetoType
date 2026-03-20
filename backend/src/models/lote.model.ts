export interface Lote {
  id: string;
  produtoId: string;
  nomeProduto?: string;
  quantidade: number;
  dataValidade: string | null;
  codigoBarras: string | null;
  observacao: string;
  criadoEm: string;
  criadoPor: string | null;
  nomeOperador?: string | null;
}

export interface CriarLoteDTO {
  quantidade: number;
  dataValidade?: string | null;
  codigoBarras?: string | null;  // ← estava faltando
  observacao?: string;
}