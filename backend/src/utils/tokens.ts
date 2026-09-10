import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types/index.js';

const ACCESS_EXPIRES_IN = '7d';
const REFRESH_EXPIRES_IN = '30d';

export function makeTokens(userId: string): { access: string; refresh: string } {
  const access = jwt.sign({ userId, tokenType: 'access' } as JwtPayload, env.jwtSecret, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
  const refresh = jwt.sign({ userId, tokenType: 'refresh' } as JwtPayload, env.jwtSecret, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
  return { access, refresh };
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
