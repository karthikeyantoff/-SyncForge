import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const TOKEN_COOKIE = 'syncforge_token';

export function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function cookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}
