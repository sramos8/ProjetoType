export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function validarCPF(cpf: string): boolean {
  const c = limparCPF(cpf);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // todos iguais

  const calc = (x: number) => {
    let sum = 0;
    for (let i = 0; i < x; i++) sum += parseInt(c[i]) * (x + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };

  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10]);
}

export function formatarCPF(cpf: string): string {
  const c = limparCPF(cpf);
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}