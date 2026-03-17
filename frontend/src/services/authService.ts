import axios from 'axios';
import type { Usuario } from '../types/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor — adiciona token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor — redireciona para login se 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export { api };

export const authService = {
  login: async (email: string, senha: string) => {
    const { data } = await api.post<{ data: { token: string; usuario: Usuario } }>(
      '/auth/login', { email, senha }
    );
    return data.data;
  },
  me: async () => {
    const { data } = await api.get<{ data: Usuario }>('/auth/me');
    return data.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },
};