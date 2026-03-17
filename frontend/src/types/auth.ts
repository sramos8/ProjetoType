export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'operador';
}

export interface AuthState {
  token: string | null;
  usuario: Usuario | null;
}