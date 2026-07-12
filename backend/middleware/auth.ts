import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sup3r-s3cr3t-k3y-supportmate-2026';

export interface AuthRequest extends Request {
  admin?: { id: string; username: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export { JWT_SECRET };
