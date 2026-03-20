import { api } from './authService'; // ← usar o mesmo api com token
import type { Produto, CriarProdutoDTO, AtualizarProdutoDTO, Estatisticas } from '../types';

export const produtoService = {
  listar: async (params?: { categoria?: string; busca?: string; disponivel?: boolean }) => {
    const { data } = await api.get<{ data: Produto[]; total: number }>('/produtos', { params });
    return data;
  },
  buscar: async (id: string) => {
    const { data } = await api.get<{ data: Produto }>(`/produtos/${id}`);
    return data.data;
  },
  criar: async (dto: CriarProdutoDTO) => {
    const { data } = await api.post<{ data: Produto }>('/produtos', dto);
    return data.data;
  },
  atualizar: async (id: string, dto: AtualizarProdutoDTO) => {
    const { data } = await api.put<{ data: Produto }>(`/produtos/${id}`, dto);
    return data.data;
  },
  deletar: async (id: string) => {
    await api.delete(`/produtos/${id}`);
  },
  stats: async () => {
    const { data } = await api.get<{ data: Estatisticas }>('/produtos/stats');
    return data.data;
  },
  buscarPorBarcode: async (codigo: string) => {
    const { data } = await api.get<{ data: Produto }>(`/produtos/barcode/${encodeURIComponent(codigo)}`);
    return data.data;
  },
  alertas: async () => {
  const { data } = await api.get<{ data: {
    vencendo: Produto[];
    vencidos: Produto[];
    estoquesBaixos: Produto[];
    semEstoque: Produto[];
    totalAlertas: number;
  }}>('/produtos/alertas');
  return data.data;
},
};