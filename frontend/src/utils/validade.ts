export type StatusValidade = 'ok' | 'vencendo' | 'vencido' | 'sem_data';
export type StatusEstoque  = 'ok' | 'baixo' | 'zerado';

export interface AlertaProduto {
  statusValidade: StatusValidade;
  statusEstoque:  StatusEstoque;
  diasParaVencer: number | null;
  temAlerta:      boolean;
}

export function verificarAlertas(produto: {
  dataValidade?: string | null;
  estoque: number;
  estoqueMinimo?: number;
}): AlertaProduto {
  const hoje     = new Date();
  hoje.setHours(0, 0, 0, 0);

  // ── Validade ──────────────────────────────────────────────
  let statusValidade: StatusValidade = 'sem_data';
  let diasParaVencer: number | null  = null;

  if (produto.dataValidade) {
    const validade = new Date(produto.dataValidade + 'T00:00:00');
    const diff     = validade.getTime() - hoje.getTime();
    diasParaVencer = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (diasParaVencer < 0)      statusValidade = 'vencido';
    else if (diasParaVencer <= 7) statusValidade = 'vencendo';
    else                          statusValidade = 'ok';
  }

  // ── Estoque ───────────────────────────────────────────────
  let statusEstoque: StatusEstoque = 'ok';
  const minimo = produto.estoqueMinimo ?? 5;

  if (produto.estoque === 0)           statusEstoque = 'zerado';
  else if (produto.estoque <= minimo)  statusEstoque = 'baixo';

  const temAlerta = statusValidade === 'vencido'
    || statusValidade === 'vencendo'
    || statusEstoque  === 'zerado'
    || statusEstoque  === 'baixo';

  return { statusValidade, statusEstoque, diasParaVencer, temAlerta };
}

export function formatarValidade(dataValidade: string | null): string {
  if (!dataValidade) return '—';
  return new Date(dataValidade + 'T00:00:00').toLocaleDateString('pt-BR');
}