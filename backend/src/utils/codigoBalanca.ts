export interface DecodificacaoBalanca {
  ehCodigoBalanca: boolean;
  codigoProduto: string;
  valor: number | null;
  peso: number | null;
  tipo: 'preco' | 'peso' | 'desconhecido';
}

export function decodificarCodigoBalanca(codigo: string): DecodificacaoBalanca {
  const limpo = codigo.replace(/\D/g, '');

  if (limpo.length !== 13 || !limpo.startsWith('2')) {
    return { ehCodigoBalanca: false, codigoProduto: limpo, valor: null, peso: null, tipo: 'desconhecido' };
  }

  const codProduto = limpo.slice(1, 6);   // posições 1-5 → produto
  const dadosValor = limpo.slice(7, 12);  // posições 7-11 → valor ← CORREÇÃO AQUI

  // Validação com os códigos reais:
  // 2000100004203 → produto=00010, dadosValor=00420 → R$ 4,20 ✓
  // 2000010004195 → produto=00001, dadosValor=00419 → R$ 4,19 ✓
  // 2000010004218 → produto=00001, dadosValor=00421 → R$ 4,21 ✓

  const segundoDigito = parseInt(limpo[1]);

  let valor: number | null = null;
  let peso: number | null  = null;
  let tipo: 'preco' | 'peso' | 'desconhecido' = 'desconhecido';

  if (segundoDigito >= 0 && segundoDigito <= 4) {
    const centavos = parseInt(dadosValor);
    valor = centavos / 100;
    tipo  = 'preco';
  } else if (segundoDigito >= 5 && segundoDigito <= 9) {
    const gramas = parseInt(dadosValor);
    peso  = gramas / 1000;
    tipo  = 'peso';
  }

  return { ehCodigoBalanca: true, codigoProduto: codProduto, valor, peso, tipo };
}

export function extrairCodigoProdutoBalanca(codigo: string): string {
  const limpo = codigo.replace(/\D/g, '');
  if (limpo.length === 13 && limpo.startsWith('2')) {
    return limpo.slice(1, 6);
  }
  return limpo;
}