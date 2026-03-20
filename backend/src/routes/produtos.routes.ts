import { Router } from 'express';
import { listarProdutos, buscarProduto, criarProduto, atualizarProduto, deletarProduto, estatisticas, buscarPorCodigoBarras, alertas  } from '../controllers/produto.controller';

const router = Router();

router.get('/stats', estatisticas);
router.get('/alertas', alertas);
router.get('/', listarProdutos);
router.get('/:id', buscarProduto);
router.post('/', criarProduto);
router.put('/:id', atualizarProduto);
router.delete('/:id', deletarProduto);
// Adicione antes das outras rotas:
router.get('/barcode/:codigo', buscarPorCodigoBarras);

export default router;