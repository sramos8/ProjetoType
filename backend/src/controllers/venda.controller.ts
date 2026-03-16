import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import type { Venda, ItemVenda, CriarItemDTO, ConcluirVendaDTO } from '../models/venda.model';

// ── Helpers ──────────────────────────────────────────────────
function getVendaComItens(vendaId: string): Venda | null {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(vendaId) as Omit<Venda,'itens'> | undefined;
  if (!venda) return null;
  const itens = db.prepare('SELECT * FROM itens_venda WHERE vendaId = ?').all(vendaId) as ItemVenda[];
  return { ...venda, itens };
}

// ── Criar venda (carrinho vazio) ──────────────────────────────
export const criarVenda = (req: Request, res: Response): void => {
  const now = new Date().toISOString();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO vendas (id, status, valorTotal, criadoEm)
    VALUES (?, 'aberta', 0, ?)
  `).run(id, now);
  res.status(201).json({ data: getVendaComItens(id) });
};

// ── Adicionar item ao carrinho ────────────────────────────────
export const adicionarItem = (req: Request, res: Response): void => {
  const { vendaId } = req.params;
  const { produtoId, quantidade }: CriarItemDTO = req.body;

  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(vendaId) as Venda | undefined;
  if (!venda) { res.status(404).json({ erro: 'Venda não encontrada' }); return; }
  if (venda.status !== 'aberta') { res.status(400).json({ erro: 'Venda não está aberta' }); return; }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId) as
    { id: string; nome: string; preco: number; estoque: number; disponivel: number } | undefined;

  if (!produto) { res.status(404).json({ erro: 'Produto não encontrado' }); return; }
  if (!produto.disponivel) { res.status(400).json({ erro: 'Produto indisponível' }); return; }
  if (produto.estoque < quantidade) {
    res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoque}` });
    return;
  }

  // Verificar se produto já está no carrinho
  const itemExistente = db.prepare(
    'SELECT * FROM itens_venda WHERE vendaId = ? AND produtoId = ?'
  ).get(vendaId, produtoId) as ItemVenda | undefined;

  const transacao = db.transaction(() => {
    if (itemExistente) {
      const novaQtd = itemExistente.quantidade + quantidade;
      if (produto.estoque < novaQtd) throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`);
      db.prepare('UPDATE itens_venda SET quantidade = ?, subtotal = ? WHERE id = ?')
        .run(novaQtd, novaQtd * produto.preco, itemExistente.id);
    } else {
      db.prepare(`
        INSERT INTO itens_venda (id, vendaId, produtoId, nomeProduto, quantidade, precoUnitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), vendaId, produtoId, produto.nome, quantidade, produto.preco, quantidade * produto.preco);
    }
    // Recalcular total
    const { total } = db.prepare(
      'SELECT COALESCE(SUM(subtotal), 0) as total FROM itens_venda WHERE vendaId = ?'
    ).get(vendaId) as { total: number };
    db.prepare('UPDATE vendas SET valorTotal = ? WHERE id = ?').run(total, vendaId);
  });

  try {
    transacao();
    res.json({ data: getVendaComItens(vendaId) });
  } catch (e: unknown) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao adicionar item' });
  }
};

// ── Remover item do carrinho ──────────────────────────────────
export const removerItem = (req: Request, res: Response): void => {
  const { vendaId, itemId } = req.params;
  const result = db.prepare(
    'DELETE FROM itens_venda WHERE id = ? AND vendaId = ?'
  ).run(itemId, vendaId);
  if (result.changes === 0) { res.status(404).json({ erro: 'Item não encontrado' }); return; }

  const { total } = db.prepare(
    'SELECT COALESCE(SUM(subtotal), 0) as total FROM itens_venda WHERE vendaId = ?'
  ).get(vendaId) as { total: number };
  db.prepare('UPDATE vendas SET valorTotal = ? WHERE id = ?').run(total, vendaId);
  res.json({ data: getVendaComItens(vendaId) });
};

// ── Atualizar quantidade de item ──────────────────────────────
export const atualizarQuantidade = (req: Request, res: Response): void => {
  const { vendaId, itemId } = req.params;
  const { quantidade }: { quantidade: number } = req.body;

  if (quantidade <= 0) {
    // Remover item se qtd = 0
    db.prepare('DELETE FROM itens_venda WHERE id = ? AND vendaId = ?').run(itemId, vendaId);
  } else {
    const item = db.prepare('SELECT * FROM itens_venda WHERE id = ?').get(itemId) as ItemVenda | undefined;
    if (!item) { res.status(404).json({ erro: 'Item não encontrado' }); return; }
    const produto = db.prepare('SELECT estoque FROM produtos WHERE id = ?').get(item.produtoId) as { estoque: number };
    if (produto.estoque < quantidade) {
      res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoque}` });
      return;
    }
    db.prepare('UPDATE itens_venda SET quantidade = ?, subtotal = ? WHERE id = ?')
      .run(quantidade, quantidade * item.precoUnitario, itemId);
  }

  const { total } = db.prepare(
    'SELECT COALESCE(SUM(subtotal), 0) as total FROM itens_venda WHERE vendaId = ?'
  ).get(vendaId) as { total: number };
  db.prepare('UPDATE vendas SET valorTotal = ? WHERE id = ?').run(total, vendaId);
  res.json({ data: getVendaComItens(vendaId) });
};

// ── Concluir venda — baixa no estoque ────────────────────────
export const concluirVenda = (req: Request, res: Response): void => {
  const { vendaId } = req.params;
  const { formaPagamento, valorPago, observacao }: ConcluirVendaDTO = req.body;

  const venda = getVendaComItens(vendaId);
  if (!venda) { res.status(404).json({ erro: 'Venda não encontrada' }); return; }
  if (venda.status !== 'aberta') { res.status(400).json({ erro: 'Venda não está aberta' }); return; }
  if (venda.itens.length === 0) { res.status(400).json({ erro: 'Carrinho vazio' }); return; }
  if (valorPago < venda.valorTotal) {
    res.status(400).json({ erro: `Valor pago insuficiente. Total: R$ ${venda.valorTotal.toFixed(2)}` });
    return;
  }

  const transacao = db.transaction(() => {
    // 1. Baixa no estoque de cada item
    for (const item of venda.itens) {
      const prod = db.prepare('SELECT estoque FROM produtos WHERE id = ?').get(item.produtoId) as { estoque: number };
      if (prod.estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para "${item.nomeProduto}". Disponível: ${prod.estoque}`);
      }
      db.prepare('UPDATE produtos SET estoque = estoque - ?, atualizadoEm = ? WHERE id = ?')
        .run(item.quantidade, new Date().toISOString(), item.produtoId);
    }
    // 2. Finalizar venda
    const troco = valorPago - venda.valorTotal;
    db.prepare(`
      UPDATE vendas
      SET status = 'concluida', formaPagamento = ?, valorPago = ?, troco = ?,
          observacao = ?, concluidoEm = ?
      WHERE id = ?
    `).run(formaPagamento, valorPago, troco, observacao ?? '', new Date().toISOString(), vendaId);
  });

  try {
    transacao();
    res.json({ data: getVendaComItens(vendaId), mensagem: 'Venda concluída com sucesso!' });
  } catch (e: unknown) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao concluir venda' });
  }
};

// ── Cancelar venda ────────────────────────────────────────────
export const cancelarVenda = (req: Request, res: Response): void => {
  const { vendaId } = req.params;
  const venda = db.prepare('SELECT status FROM vendas WHERE id = ?').get(vendaId) as { status: string } | undefined;
  if (!venda) { res.status(404).json({ erro: 'Venda não encontrada' }); return; }
  if (venda.status === 'concluida') { res.status(400).json({ erro: 'Não é possível cancelar venda concluída' }); return; }
  db.prepare("UPDATE vendas SET status = 'cancelada' WHERE id = ?").run(vendaId);
  res.json({ data: getVendaComItens(vendaId), mensagem: 'Venda cancelada' });
};

// ── Buscar venda ──────────────────────────────────────────────
export const buscarVenda = (req: Request, res: Response): void => {
  const venda = getVendaComItens(req.params.vendaId);
  if (!venda) { res.status(404).json({ erro: 'Venda não encontrada' }); return; }
  res.json({ data: venda });
};

// ── Listar vendas (histórico) ─────────────────────────────────
export const listarVendas = (req: Request, res: Response): void => {
  const { status, dataInicio, dataFim, limit = '50', offset = '0' } = req.query;
  let query = 'SELECT * FROM vendas WHERE 1=1';
  const params: unknown[] = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (dataInicio) { query += ' AND criadoEm >= ?'; params.push(dataInicio); }
  if (dataFim) { query += ' AND criadoEm <= ?'; params.push(dataFim + 'T23:59:59'); }
  query += ' ORDER BY criadoEm DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const vendas = db.prepare(query).all(...params) as Omit<Venda, 'itens'>[];
  const total = (db.prepare('SELECT COUNT(*) as c FROM vendas WHERE 1=1').get() as { c: number }).c;
  res.json({ data: vendas, total });
};

// ── Relatório de faturamento ──────────────────────────────────
export const relatorio = (req: Request, res: Response): void => {
  const { dataInicio, dataFim } = req.query;
  const filtroData = dataInicio && dataFim
    ? `AND criadoEm BETWEEN '${dataInicio}' AND '${dataFim}T23:59:59'`
    : '';

  const resumo = db.prepare(`
    SELECT
      COUNT(*) as totalVendas,
      COALESCE(SUM(valorTotal), 0) as faturamentoBruto,
      COALESCE(AVG(valorTotal), 0) as ticketMedio,
      COUNT(CASE WHEN status='cancelada' THEN 1 END) as canceladas
    FROM vendas WHERE status = 'concluida' ${filtroData}
  `).get() as { totalVendas: number; faturamentoBruto: number; ticketMedio: number; canceladas: number };

  const porFormaPagamento = db.prepare(`
    SELECT formaPagamento, COUNT(*) as qtd, SUM(valorTotal) as total
    FROM vendas WHERE status = 'concluida' ${filtroData}
    GROUP BY formaPagamento
  `).all() as { formaPagamento: string; qtd: number; total: number }[];

  const produtosMaisVendidos = db.prepare(`
    SELECT iv.nomeProduto, SUM(iv.quantidade) as totalQtd, SUM(iv.subtotal) as totalValor
    FROM itens_venda iv
    JOIN vendas v ON iv.vendaId = v.id
    WHERE v.status = 'concluida' ${filtroData}
    GROUP BY iv.produtoId, iv.nomeProduto
    ORDER BY totalQtd DESC LIMIT 10
  `).all() as { nomeProduto: string; totalQtd: number; totalValor: number }[];

  const vendasPorDia = db.prepare(`
    SELECT DATE(criadoEm) as dia,
           COUNT(*) as qtd,
           SUM(valorTotal) as total
    FROM vendas WHERE status = 'concluida' ${filtroData}
    GROUP BY DATE(criadoEm)
    ORDER BY dia DESC LIMIT 30
  `).all() as { dia: string; qtd: number; total: number }[];

  res.json({ data: { resumo, porFormaPagamento, produtosMaisVendidos, vendasPorDia } });
};