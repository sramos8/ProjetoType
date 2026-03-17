export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function formatarCPF(valor: string): string {
  const c = limparCPF(valor).slice(0, 11);
  if (c.length <= 3) return c;
  if (c.length <= 6) return `${c.slice(0,3)}.${c.slice(3)}`;
  if (c.length <= 9) return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6)}`;
  return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9)}`;
}

export function validarCPF(cpf: string): boolean {
  const c = limparCPF(cpf);

  // Deve ter exatamente 11 dígitos
  if (c.length !== 11) return false;

  // Rejeitar sequências repetidas (111.111.111-11 etc)
  if (/^(\d)\1{10}$/.test(c)) return false;

  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(c[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(c[9])) return false;

  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(c[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(c[10])) return false;

  return true;
}