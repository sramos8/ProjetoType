import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db';
import { validarCPF, limparCPF } from '../utils/cpf';
import type { Usuario } from '../models/usuario.model';

const JWT_SECRET  = process.env.JWT_SECRET  || 'padaria-secret-dev';
const JWT_EXPIRES = (process.env.JWT_EXPIRES || '8h') as SignOptions['expiresIn'];

// ── Login ─────────────────────────────────────────────────────
export const login = (req: Request, res: Response): void => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    res.status(400).json({ erro: 'Email e senha obrigatórios' });
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
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    data: {
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
    },
  });
};

// ── Me ────────────────────────────────────────────────────────
export const me = (req: Request, res: Response): void => {
  const usuario = db.prepare(
    'SELECT id, nome, email, cpf, idade, sexo, role FROM usuarios WHERE id = ?'
  ).get(req.usuario!.id);
  if (!usuario) { res.status(404).json({ erro: 'Usuário não encontrado' }); return; }
  res.json({ data: usuario });
};

// ── Buscar por CPF ────────────────────────────────────────────
export const buscarPorCPF = (req: Request, res: Response): void => {
  const cpf = limparCPF(req.params.cpf);

  if (!validarCPF(cpf)) {
    res.status(400).json({ erro: 'CPF inválido' });
    return;
  }

  const usuario = db.prepare(
    'SELECT id, nome, email, cpf, idade, sexo, role FROM usuarios WHERE cpf = ?'
  ).get(cpf) as Omit<Usuario, 'senha' | 'criadoEm' | 'ativo'> | undefined;

  if (!usuario) {
    res.status(404).json({ erro: 'Nenhum usuário encontrado com este CPF' });
    return;
  }

  res.json({ data: usuario });
};

// ── Criar usuário ─────────────────────────────────────────────
export const criarUsuario = (req: Request, res: Response): void => {
  const { nome, email, cpf, senha, idade, sexo, role = 'operador' } = req.body;

  if (!nome || !email || !cpf || !senha) {
    res.status(400).json({ erro: 'Nome, email, CPF e senha são obrigatórios' });
    return;
  }

  const cpfLimpo = limparCPF(cpf);

  if (!validarCPF(cpfLimpo)) {
    res.status(400).json({ erro: 'CPF inválido' });
    return;
  }

  const cpfExiste = db.prepare('SELECT id FROM usuarios WHERE cpf = ?').get(cpfLimpo);
  if (cpfExiste) {
    res.status(400).json({ erro: 'CPF já cadastrado' });
    return;
  }

  const emailExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (emailExiste) {
    res.status(400).json({ erro: 'Email já cadastrado' });
    return;
  }

  const hash = bcrypt.hashSync(senha, 10);
  const id   = uuidv4();
  const now  = new Date().toISOString();

  db.prepare(`
    INSERT INTO usuarios (id, nome, email, cpf, senha, idade, sexo, role, ativo, criadoEm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, nome, email, cpfLimpo, hash, idade ?? null, sexo ?? null, role, now);

  res.status(201).json({
    data: { id, nome, email, cpf: cpfLimpo, idade, sexo, role },
    mensagem: 'Usuário criado com sucesso',
  });
};

// ── Listar usuários ───────────────────────────────────────────
export const listarUsuarios = (_req: Request, res: Response): void => {
  const usuarios = db.prepare(
    'SELECT id, nome, email, cpf, idade, sexo, role, ativo, criadoEm FROM usuarios ORDER BY criadoEm DESC'
  ).all();
  res.json({ data: usuarios });
};

// ── Alterar senha ─────────────────────────────────────────────
export const alterarSenha = (req: Request, res: Response): void => {
  const { senhaAtual, novaSenha } = req.body;
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario!.id) as Usuario;
  if (!bcrypt.compareSync(senhaAtual, usuario.senha)) {
    res.status(400).json({ erro: 'Senha atual incorreta' });
    return;
  }
  db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(bcrypt.hashSync(novaSenha, 10), usuario.id);
  res.json({ mensagem: 'Senha alterada com sucesso' });
};