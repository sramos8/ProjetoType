export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  idade: number | null;
  sexo: 'M' | 'F' | 'outro' | null;
  role: 'admin' | 'operador';
  ativo: boolean;
  criadoEm: string;
}

export type LoginDTO       = { email: string; senha: string };
export type CriarUsuarioDTO = Omit<Usuario, 'id' | 'criadoEm' | 'senha'> & { senha: string };