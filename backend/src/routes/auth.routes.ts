import { Router } from 'express';
import {
  login, me, buscarPorCPF, criarUsuario, listarUsuarios, alterarSenha
} from '../controllers/auth.controller';
import { autenticar, apenasAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/login',              login);
router.get('/me',                  autenticar, me);
router.get('/cpf/:cpf',            autenticar, apenasAdmin, buscarPorCPF);
router.post('/usuarios',           autenticar, apenasAdmin, criarUsuario);
router.get('/usuarios',            autenticar, apenasAdmin, listarUsuarios);
router.put('/senha',               autenticar, alterarSenha);

export default router;