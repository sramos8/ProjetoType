import { Router } from 'express';
import {
  criarVenda, adicionarItem, removerItem, atualizarQuantidade,
  concluirVenda, cancelarVenda, buscarVenda, listarVendas, relatorio
} from '../controllers/venda.controller';

const router = Router();

router.get('/relatorio', relatorio);
router.get('/', listarVendas);
router.post('/', criarVenda);
router.get('/:vendaId', buscarVenda);
router.post('/:vendaId/itens', adicionarItem);
router.put('/:vendaId/itens/:itemId', atualizarQuantidade);
router.delete('/:vendaId/itens/:itemId', removerItem);
router.post('/:vendaId/concluir', concluirVenda);
router.post('/:vendaId/cancelar', cancelarVenda);

export default router;