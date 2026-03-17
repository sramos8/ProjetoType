import { Router } from 'express';
import { login, me, listarUsuarios, criarUsuario, alterarSenha } from '../controllers/auth.controller';
import { autenticar, apenasAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', autenticar, me);
router.get('/usuarios', autenticar, apenasAdmin, listarUsuarios);
router.post('/usuarios', autenticar, apenasAdmin, criarUsuario);
router.put('/senha', autenticar, alterarSenha);

export default router;