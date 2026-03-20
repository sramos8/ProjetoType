import { api } from './authService';
import type { Lote } from '../types/lote';

export const loteService = {
  listar: async (produtoId: string) => {
    const { data } = await api.get<{ data: Lote[] }>(`/produtos/${produtoId}/lotes`);
    return data.data;
  },
  adicionar: async (produtoId: string, dto: { quantidade: number; dataValidade?: string | null; observacao?: string; codigoBarras?: string | null }) => {
    const { data } = await api.post<{ data: Lote }>(`/produtos/${produtoId}/lotes`, dto);
    return data.data;
  },
  remover: async (produtoId: string, loteId: string) => {
    await api.delete(`/produtos/${produtoId}/lotes/${loteId}`);
  },
};