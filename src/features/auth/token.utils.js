import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

// ─── Token Utils ───
export const signAccessToken = (userId, role, rememberMe) => {
  let expiresIn = '7d'
  if (rememberMe === true) expiresIn = '30d'
  else if (rememberMe === false) expiresIn = '1d'
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn })
}

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);
