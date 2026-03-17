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
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false;
  const calc = (x: number) => {
    let sum = 0;
    for (let i = 0; i < x; i++) sum += parseInt(c[i]) * (x + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 || r === 11 ? 0 : r;
  };
  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10]);
}