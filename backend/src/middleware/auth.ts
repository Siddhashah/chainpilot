import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/tokens.js';
import { User } from '../models/User.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Authentication credentials were not provided' });
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
}
