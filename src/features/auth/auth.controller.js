import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { signAccessToken } from './token.utils.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../../../shared/schemas/auth.schema.js';

export const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { name, email, password } = result.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const accessToken = signAccessToken(user.id, user.role);
  res.status(201).json({
    accessToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

export const login = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    }

    const { email, password } = result.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = signAccessToken(user.id, user.role);
    res.json({
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  res.json({ message: 'Logged out' });
};

export const changePassword = async (req, res) => {
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { currentPassword, newPassword } = result.data;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  await prisma.auditLog.create({
    data: {
      action: 'Password changed',
      entityType: 'User',
      entityId: user.id,
      actorId: user.id,
      actorName: user.name,
      severity: 'Security',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });

  res.json({ message: 'Password changed successfully' });
};
