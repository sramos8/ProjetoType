import { Router } from 'express';
import { listarProdutos, buscarProduto, criarProduto, atualizarProduto, deletarProduto, estatisticas } from '../controllers/produto.controller';

const router = Router();

router.get('/stats', estatisticas);
router.get('/', listarProdutos);
router.get('/:id', buscarProduto);
router.post('/', criarProduto);
router.put('/:id', atualizarProduto);
router.delete('/:id', deletarProduto);

export default router;