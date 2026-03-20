/**
 * Decodifica códigos de balança brasileiros (EAN-13 começando com 2)
 *
 * Formato padrão mais comum (ABCDEF):
 *   2 PPPPP VVVVV C
 *   P = código do produto (5 dígitos)
 *   V = valor em centavos (5 dígitos) OU peso em gramas
 *   C = dígito verificador
 *
 * Exemplos:
 *   2 000100 00420 3 → produto 00010, valor R$ 4,20
 *   2 000010 00419 5 → produto 00001, valor R$ 4,19
 */

export interface DecodificacaoBalanca {
  ehCodigoBalanca: boolean;
  codigoProduto: string;   // código interno do produto
  valor: number | null;    // valor em R$
  peso: number | null;     // peso em kg
  tipo: 'preco' | 'peso' | 'desconhecido';
}

export function decodificarCodigoBalanca(codigo: string): DecodificacaoBalanca {
  const limpo = codigo.replace(/\D/g, '');

  // Não é código de balança
  if (limpo.length !== 13 || !limpo.startsWith('2')) {
    return { ehCodigoBalanca: false, codigoProduto: limpo, valor: null, peso: null, tipo: 'desconhecido' };
  }

  // Extrai partes do código
  const prefixo      = limpo[0];                    // '2'
  const codProduto   = limpo.slice(1, 6);            // 5 dígitos do produto
  const dadosValor   = limpo.slice(6, 11);           // 5 dígitos do valor/peso
  const digitoVerif  = limpo[12];                    // dígito verificador

  // Detecta se é preço ou peso pelo padrão do código do produto
  // Prefixo 20-29: peso em gramas
  // Prefixo 21-25: preço em centavos (mais comum no Brasil)
  const segundoDigito = parseInt(limpo[1]);

  let valor: number | null = null;
  let peso: number | null  = null;
  let tipo: 'preco' | 'peso' | 'desconhecido' = 'desconhecido';

  if (segundoDigito >= 0 && segundoDigito <= 4) {
    // Formato PREÇO: últimos 4 ou 5 dígitos = centavos
    // Ex: 00420 → R$ 4,20  |  04195 → R$ 41,95
    const centavos = parseInt(dadosValor);
    valor = centavos / 100;
    tipo  = 'preco';
  } else if (segundoDigito >= 5 && segundoDigito <= 9) {
    // Formato PESO: dígitos = gramas
    // Ex: 00385 → 0,385 kg
    const gramas = parseInt(dadosValor);
    peso  = gramas / 1000;
    tipo  = 'peso';
  }

  return {
    ehCodigoBalanca: true,
    codigoProduto: codProduto,
    valor,
    peso,
    tipo,
  };
}

/**
 * Tenta identificar o produto pelo prefixo do código de balança
 * Os 5 dígitos do produto são usados para buscar no banco
 */
export function extrairCodigoProdutoBalanca(codigo: string): string {
  const limpo = codigo.replace(/\D/g, '');
  if (limpo.length === 13 && limpo.startsWith('2')) {
    return limpo.slice(1, 6); // retorna os 5 dígitos do produto
  }
  return limpo;
}