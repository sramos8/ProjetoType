import { Router } from 'express';
import { listarLotes, adicionarLote, removerLote, alertasLotes } from '../controllers/lote.controller';
import { autenticar } from '../middleware/auth.middleware';

const router = Router();

router.get('/alertas',                    autenticar, alertasLotes);
router.get('/:produtoId/lotes',           autenticar, listarLotes);
router.post('/:produtoId/lotes',          autenticar, adicionarLote);
router.delete('/:produtoId/lotes/:loteId', autenticar, removerLote);

export default router;