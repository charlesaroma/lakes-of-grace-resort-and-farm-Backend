import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const signAccessToken = (userId, role) =>
  jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '7d' });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);
