import  { Request, Response } from 'express';
import  {v4 as uuidv4} from 'uuid';
import db from '../database/db';
import type { Produto, CriarProdutoDTO, AtualizarProdutoDTO } from '../models/produto.model';
import { decodificarCodigoBalanca } from '../utils/codigoBalanca';

function rowToProduto(row: Record<string, unknown>): Produto {
    return {
        ...(row as Omit<Produto, 'disponivel'>),
        disponivel: row.disponivel === 1,
    };
}

export const listarProdutos = (req: Request, res: Response): void => {
    const { categoria, busca, disponivel } = req.query;

    let query = 'SELECT * FROM produtos WHERE 1=1';
    const params: unknown[] = [];

    if (categoria) {
        query += ' AND categoria = ?';
        params.push(categoria);
    }
    if (disponivel !== undefined) {
        query += ' AND disponivel = ?';
        params.push(disponivel === 'true' ? 1 : 0);
    }
    if (busca) {
        query += ' AND (nome LIKE ? OR descricao LIKE ?)';
        params.push(`%${busca}%`, `%${busca}%`);
    }

    query += ' ORDER BY criadoEm DESC';

    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    res.json({ data : rows.map(rowToProduto), total: rows.length });
};

export const buscarProduto = (req: Request, res: Response): void => {
    const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;

    if (!row) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
    }
    res.json(rowToProduto(row));
};

export const criarProduto = (req: Request, res: Response): void => {
    const { nome, categoria, preco, estoque, descricao, disponivel } : CriarProdutoDTO = req.body;

    if (!nome || !categoria || preco === undefined) {
        res.status(400).json({ error: 'Campos obrigatórios: nome, categoria, preco' });
        return;
    }
    const now = new Date().toISOString();
    const produto: Produto = {
        id: uuidv4(),
        nome: nome.trim(),
        categoria,
        preco: Number(preco),
        estoque: Number(estoque ?? 0),
        descricao: descricao?.trim() ?? '',
        disponivel: disponivel ?? true,
        codigoBarras: null, // ← novo campo
        criadoEm: now,
        atualizadoEm: now,
    };

    db.prepare(`
    INSERT INTO produtos (id, nome, categoria, preco, estoque, descricao, disponivel, criadoEm, atualizadoEm)
    VALUES (@id, @nome, @categoria, @preco, @estoque, @descricao, @disponivel, @criadoEm, @atualizadoEm)
    `).run({ ...produto, disponivel: produto.disponivel ? 1 : 0 });

    res.status(201).json({ data: produto, message: 'Produto criado com sucesso' });
};

export const atualizarProduto = (req: Request, res: Response): void => {
    const existente = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
    if (!existente) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
    }

    const campos: AtualizarProdutoDTO = req.body;
    const sets: string[] = [];
    const valores: Record<string, unknown> = { id: req.params.id, atualizadoEm: new Date().toISOString() };

    const permitidos = ['nome', 'categoria', 'preco', 'estoque', 'descricao', 'disponivel'] as const;
    permitidos.forEach(campo => {
        if (campo in campos) {
            sets.push(`${campo} = @${campo}`);
            valores[campo] = campo === 'disponivel' ? (campos[campo] ? 1 : 0) : campos[campo];
        }
    });
     if (sets.length === 0) {
        res.status(400).json({ error: 'Nenhum campo válido para atualização' });
        return;
    }

    sets.push('atualizadoEm = @atualizadoEm');
    db.prepare(`UPDATE produtos SET ${sets.join(', ')} WHERE id = @id`).run(valores);

    const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json({ data: rowToProduto(atualizado), message: 'Produto atualizado com sucesso' });
}

export const deletarProduto = (req: Request, res: Response): void => {
    const result = db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
    }
    res.json({ message: 'Produto deletado com sucesso' });
};

export const estatisticas = (req: Request, res: Response): void => {
    const stats = {
        total: (db.prepare('SELECT COUNT(*) AS c FROM produtos').get() as { c: number }).c,
        disponiveis: (db.prepare('SELECT COUNT(*) AS c FROM produtos WHERE disponivel = 1').get() as { c: number }).c,
        valorEstoque: (db.prepare('SELECT SUM(preco * estoque) AS v FROM produtos').get() as { v: number }).v || 0,
        porCategoria: db.prepare('SELECT categoria, COUNT(*) AS c FROM produtos GROUP BY categoria').all() as { categoria: string, c: number }[],
    }
    res.json({ data: stats });
};

// Adicione esta função:
export const buscarPorCodigoBarras = (req: Request, res: Response): void => {
  const { codigo } = req.params;
  const limpo = codigo.replace(/\D/g, '');

  // ── Tenta decodificar como código de balança ──────────────
  const balanca = decodificarCodigoBalanca(limpo);

  if (balanca.ehCodigoBalanca) {
    // Busca produto pelo prefixo do código de balança (5 dígitos)
    // Tenta primeiro pelo codigoBalanca exato, depois pelo prefixo
    let produto = db.prepare(
      "SELECT * FROM produtos WHERE REPLACE(codigoBarras, ' ', '') LIKE ? AND disponivel = 1"
    ).get(`2${balanca.codigoProduto}%`) as Record<string, unknown> | undefined;

    // Se não achou pelo código, busca pelo prefixo guardado
    if (!produto) {
      produto = db.prepare(
        "SELECT * FROM produtos WHERE codigoBarras = ? AND disponivel = 1"
      ).get(balanca.codigoProduto) as Record<string, unknown> | undefined;
    }

    if (!produto) {
      res.status(404).json({
        erro: `Produto não encontrado para o código de balança (prefixo: ${balanca.codigoProduto})`,
        codigoBalanca: balanca,
      });
      return;
    }

    const produtoFormatado = rowToProduto(produto);

    // Retorna produto com o valor/preço embutido no código
    res.json({
      data: {
        ...produtoFormatado,
        precoSugerido: balanca.valor,    // preço extraído do código
        pesoLido:      balanca.peso,     // peso extraído (se for código de peso)
        tipoBalanca:   balanca.tipo,
        ehCodigoBalanca: true,
      },
    });
    return;
  }
// ── Código de barras normal ───────────────────────────────
  const produto = db.prepare(
    'SELECT * FROM produtos WHERE codigoBarras = ? AND disponivel = 1'
  ).get(limpo) as Record<string, unknown> | undefined;

  if (!produto) {
    res.status(404).json({ erro: `Produto não encontrado: ${codigo}` });
    return;
  }

  res.json({ data: { ...rowToProduto(produto), ehCodigoBalanca: false } });
};