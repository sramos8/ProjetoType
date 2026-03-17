import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import type { Usuario, LoginDTO } from '../models/usuario.model';

const JWT_SECRET  = process.env.JWT_SECRET  || 'padaria-secret-dev';
const JWT_EXPIRES = (process.env.JWT_EXPIRES || '8h') as SignOptions['expiresIn'];

export const login = (req: Request, res: Response): void => {
  const { email, senha }: LoginDTO = req.body;

  if (!email || !senha) {
    res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    return;
  }

  const usuario = db.prepare(
    'SELECT * FROM usuarios WHERE email = ? AND ativo = 1'
  ).get(email) as Usuario | undefined;

  if (!usuario || !bcrypt.compareSync(senha, usuario.senha)) {
    res.status(401).json({ erro: 'Email ou senha incorretos' });
    return;
  }

 const token = jwt.sign(
  { id: usuario.id, email: usuario.email, role: usuario.role },
  JWT_SECRET as string,
  { expiresIn: JWT_EXPIRES }
);

  res.json({
    data: {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    },
    mensagem: 'Login realizado com sucesso',
  });
};

export const me = (req: Request, res: Response): void => {
  const usuario = db.prepare(
    'SELECT id, nome, email, role FROM usuarios WHERE id = ?'
  ).get(req.usuario!.id) as Omit<Usuario, 'senha' | 'criadoEm' | 'ativo'> | undefined;

  if (!usuario) {
    res.status(404).json({ erro: 'Usuário não encontrado' });
    return;
  }
  res.json({ data: usuario });
};

export const listarUsuarios = (req: Request, res: Response): void => {
  const usuarios = db.prepare(
    'SELECT id, nome, email, role, ativo, criadoEm FROM usuarios ORDER BY criadoEm DESC'
  ).all();
  res.json({ data: usuarios });
};

export const criarUsuario = (req: Request, res: Response): void => {
  const { nome, email, senha, role = 'operador' } = req.body;

  if (!nome || !email || !senha) {
    res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    return;
  }

  const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existe) {
    res.status(400).json({ erro: 'Email já cadastrado' });
    return;
  }

  const hash = bcrypt.hashSync(senha, 10);
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO usuarios (id, nome, email, senha, role, ativo, criadoEm)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(id, nome, email, hash, role, now);

  res.status(201).json({
    data: { id, nome, email, role },
    mensagem: 'Usuário criado com sucesso',
  });
};

export const alterarSenha = (req: Request, res: Response): void => {
  const { senhaAtual, novaSenha } = req.body;

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario!.id) as Usuario;

  if (!bcrypt.compareSync(senhaAtual, usuario.senha)) {
    res.status(400).json({ erro: 'Senha atual incorreta' });
    return;
  }

  const hash = bcrypt.hashSync(novaSenha, 10);
  db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(hash, usuario.id);
  res.json({ mensagem: 'Senha alterada com sucesso' });
};