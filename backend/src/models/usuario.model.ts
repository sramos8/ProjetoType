export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: 'admin' | 'operador';
  ativo: boolean;
  criadoEm: string;
}

export type CriarUsuarioDTO = Omit<Usuario, 'id' | 'criadoEm'>;
export type LoginDTO = { email: string; senha: string };