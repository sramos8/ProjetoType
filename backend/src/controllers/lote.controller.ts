import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import type { Lote, CriarLoteDTO } from '../models/lote.model';

// ── Listar lotes de um produto ────────────────────────────────
export const listarLotes = (req: Request, res: Response): void => {
  const { produtoId } = req.params;

  const lotes = db.prepare(`
    SELECT l.*, u.nome as nomeOperador
    FROM lotes_estoque l
    LEFT JOIN usuarios u ON l.criadoPor = u.id
    WHERE l.produtoId = ?
    ORDER BY l.criadoEm DESC
  `).all(produtoId) as Lote[];

  res.json({ data: lotes });
};

// ── Adicionar lote (entrada de estoque) ───────────────────────
export const adicionarLote = (req: Request, res: Response): void => {
  const { produtoId } = req.params;
  const { quantidade, dataValidade, codigoBarras, observacao }: CriarLoteDTO = req.body;

  if (!quantidade || quantidade <= 0) {
    res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
    return;
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(produtoId) as
    { id: string; nome: string; estoque: number } | undefined;
  if (!produto) {
    res.status(404).json({ erro: 'Produto não encontrado' });
    return;
  }

  const transacao = db.transaction(() => {
    const id  = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO lotes_estoque (id, produtoId, quantidade, dataValidade, codigoBarras, observacao, criadoEm, criadoPor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, produtoId, quantidade,
      dataValidade  || null,
      codigoBarras?.trim() || null,  // ← novo
      observacao    || '',
      now,
      req.usuario?.id || null
    );

    db.prepare(`
      UPDATE produtos SET estoque = estoque + ?, atualizadoEm = ? WHERE id = ?
    `).run(quantidade, now, produtoId);

    const maisProxima = db.prepare(`
      SELECT MIN(dataValidade) as minData
      FROM lotes_estoque
      WHERE produtoId = ?
        AND dataValidade IS NOT NULL
        AND dataValidade >= DATE('now')
    `).get(produtoId) as { minData: string | null };

    if (maisProxima?.minData) {
      db.prepare('UPDATE produtos SET dataValidade = ? WHERE id = ?')
        .run(maisProxima.minData, produtoId);
    }

    return db.prepare(`
      SELECT l.*, u.nome as nomeOperador
      FROM lotes_estoque l
      LEFT JOIN usuarios u ON l.criadoPor = u.id
      WHERE l.id = ?
    `).get(id);
  });

  const lote = transacao();
  res.status(201).json({ data: lote, mensagem: 'Lote adicionado com sucesso' });
};

// ── Remover lote (ex: descarte por vencimento) ────────────────
export const removerLote = (req: Request, res: Response): void => {
  const { produtoId, loteId } = req.params;

  const lote = db.prepare(
    'SELECT * FROM lotes_estoque WHERE id = ? AND produtoId = ?'
  ).get(loteId, produtoId) as Lote | undefined;

  if (!lote) {
    res.status(404).json({ erro: 'Lote não encontrado' });
    return;
  }

  const transacao = db.transaction(() => {
    // 1. Remover o lote
    db.prepare('DELETE FROM lotes_estoque WHERE id = ?').run(loteId);

    // 2. Subtrair do estoque
    db.prepare(`
      UPDATE produtos
      SET estoque = MAX(0, estoque - ?), atualizadoEm = ?
      WHERE id = ?
    `).run(lote.quantidade, new Date().toISOString(), produtoId);

    // 3. Recalcular dataValidade mais próxima
    const maisProxima = db.prepare(`
      SELECT MIN(dataValidade) as minData
      FROM lotes_estoque
      WHERE produtoId = ?
        AND dataValidade IS NOT NULL
        AND dataValidade >= DATE('now')
    `).get(produtoId) as { minData: string | null };

    db.prepare('UPDATE produtos SET dataValidade = ? WHERE id = ?')
      .run(maisProxima?.minData || null, produtoId);
  });

  transacao();
  res.json({ mensagem: 'Lote removido e estoque ajustado' });
};

// ── Alertas de lotes vencendo ─────────────────────────────────
export const alertasLotes = (_req: Request, res: Response): void => {
  const hoje = new Date().toISOString().split('T')[0];
  const limite = new Date();
  limite.setDate(limite.getDate() + 7);
  const dataLimite = limite.toISOString().split('T')[0];

  const lotes = db.prepare(`
    SELECT l.*, p.nome as nomeProduto, p.categoria
    FROM lotes_estoque l
    JOIN produtos p ON l.produtoId = p.id
    WHERE l.dataValidade IS NOT NULL
      AND l.dataValidade <= ?
    ORDER BY l.dataValidade ASC
  `).all(dataLimite) as (Lote & { nomeProduto: string; categoria: string })[];

  res.json({ data: lotes, hoje });
};