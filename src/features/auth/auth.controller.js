import bcrypt from 'bcrypt';
import { User } from '../users/user.model.js';
import { Session } from './session.model.js';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken, hashToken,
} from './token.utils.js';
import { registerSchema, loginSchema } from '../../../shared/schemas/auth.schema.js';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const createSession = async (userId, refreshToken, req) => {
  await Session.create({
    userId,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
};

export const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { name, email, password } = result.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  await createSession(user._id, refreshToken, req);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  res.status(201).json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

export const login = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { email, password } = result.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  user.lastLogin = new Date();
  await user.save();

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  await createSession(user._id, refreshToken, req);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  res.json({
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

export const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const tokenHash = hashToken(token);
  const session = await Session.findOne({ userId: payload.sub, refreshTokenHash: tokenHash });

  if (!session || session.revoked) {
    // Reused/stolen token — kill every session for this user
    await Session.updateMany({ userId: payload.sub }, { revoked: true });
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
    return res.status(401).json({ message: 'Session invalid — please log in again' });
  }

  // Rotate: revoke the used token, issue a new pair
  session.revoked = true;
  await session.save();

  const newAccessToken = signAccessToken(payload.sub);
  const newRefreshToken = signRefreshToken(payload.sub);
  await createSession(payload.sub, newRefreshToken, req);

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS);
  res.json({ accessToken: newAccessToken });
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await Session.updateOne({ refreshTokenHash: hashToken(token) }, { revoked: true });
  }
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
  res.json({ message: 'Logged out' });
};

export const logoutAll = async (req, res) => {
  await Session.updateMany({ userId: req.userId }, { revoked: true });
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTS);
  res.json({ message: 'Logged out of all devices' });
};
