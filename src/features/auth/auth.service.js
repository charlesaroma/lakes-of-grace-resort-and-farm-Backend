import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { Session } from './session.model.js';

export const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
};

export const createSessionAndRefreshToken = async (userId, userAgent, ipAddress) => {
  // Generate a random refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Hash it before storing in DB (so if DB is compromised, tokens can't be used)
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  // Set expiration (e.g., 7 days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await Session.create({
    user: userId,
    tokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return refreshToken;
};

export const verifyAndRotateRefreshToken = async (oldRefreshToken, userAgent, ipAddress) => {
  const tokenHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
  
  const session = await Session.findOne({ tokenHash });
  
  if (!session) {
    throw new Error('Invalid or expired refresh token');
  }

  // Generate new tokens
  const newAccessToken = signAccessToken(session.user);
  const newRefreshToken = await createSessionAndRefreshToken(session.user, userAgent, ipAddress);

  // Invalidate the old session (single-use token rotation)
  await Session.deleteOne({ _id: session._id });

  return { newAccessToken, newRefreshToken, userId: session.user };
};

export const invalidateSession = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await Session.deleteOne({ tokenHash });
};
