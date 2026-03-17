import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'padaria-secret-dev';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

export const autenticar = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};

export const apenasAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.usuario?.role !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito a administradores' });
    return;
  }
  next();
};