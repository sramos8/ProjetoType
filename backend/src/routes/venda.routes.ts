import { Router } from 'express';
import {
  criarVenda, adicionarItem, removerItem, atualizarQuantidade,
  alterarPrecoItem,
  concluirVenda, cancelarVenda, buscarVenda, listarVendas, relatorio
} from '../controllers/venda.controller';

const router = Router();

// ── Rotas fixas PRIMEIRO (sem parâmetros variáveis) ──────────
router.get('/relatorio', relatorio);
router.get('/',          listarVendas);
router.post('/',         criarVenda);

// ── Rotas por vendaId ────────────────────────────────────────
router.get( '/:vendaId',           buscarVenda);
router.post('/:vendaId/concluir',  concluirVenda);
router.post('/:vendaId/cancelar',  cancelarVenda);

// ── Rotas de itens ───────────────────────────────────────────
router.post(  '/:vendaId/itens',                adicionarItem);
router.put(   '/:vendaId/itens/:itemId',         atualizarQuantidade);
router.delete('/:vendaId/itens/:itemId',         removerItem);
router.put(   '/:vendaId/itens/:itemId/preco',   alterarPrecoItem);  // ← deve vir após a rota sem /preco

export default router;