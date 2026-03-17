import { api } from './authService'; // ← importar o api com interceptor de token
import type { Venda, Relatorio } from '../types/venda';

// REMOVA qualquer import de axios e criação local de instância como:
// import axios from 'axios';
// const api = axios.create({ baseURL: ... });

export const vendaService = {
  criar: async () => {
    const { data } = await api.post<{ data: Venda }>('/vendas');
    return data.data;
  },
  buscar: async (id: string) => {
    const { data } = await api.get<{ data: Venda }>(`/vendas/${id}`);
    return data.data;
  },
  listar: async (params?: { status?: string; dataInicio?: string; dataFim?: string }) => {
    const { data } = await api.get<{ data: Venda[]; total: number }>('/vendas', { params });
    return data;
  },
  adicionarItem: async (vendaId: string, produtoId: string, quantidade: number) => {
    const { data } = await api.post<{ data: Venda }>(`/vendas/${vendaId}/itens`, { produtoId, quantidade });
    return data.data;
  },
  removerItem: async (vendaId: string, itemId: string) => {
    const { data } = await api.delete<{ data: Venda }>(`/vendas/${vendaId}/itens/${itemId}`);
    return data.data;
  },
  atualizarQuantidade: async (vendaId: string, itemId: string, quantidade: number) => {
    const { data } = await api.put<{ data: Venda }>(`/vendas/${vendaId}/itens/${itemId}`, { quantidade });
    return data.data;
  },
  concluir: async (vendaId: string, formaPagamento: string, valorPago: number, observacao?: string) => {
    const { data } = await api.post<{ data: Venda; mensagem: string }>(
      `/vendas/${vendaId}/concluir`,
      { formaPagamento, valorPago, observacao }
    );
    return data;
  },
  cancelar: async (vendaId: string) => {
    const { data } = await api.post<{ data: Venda }>(`/vendas/${vendaId}/cancelar`);
    return data.data;
  },
  relatorio: async (dataInicio?: string, dataFim?: string) => {
    const { data } = await api.get<{ data: Relatorio }>('/vendas/relatorio', {
      params: { dataInicio, dataFim }
    });
    return data.data;
  },
};