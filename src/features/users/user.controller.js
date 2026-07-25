import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { createUserSchema, updateUserSchema } from '../../../shared/schemas/user.schema.js';

const userSelect = { id: true, name: true, email: true, role: true, lastLogin: true, createdAt: true, updatedAt: true };

export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: userSelect });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: userSelect });
  res.json(users);
};

export const getUser = async (req, res) => {
  const { id } = req.params
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' })
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const createUser = async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { name, email, password, role } = result.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  await prisma.auditLog.create({
    data: {
      action: 'User Created',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      changes: { name, email, role },
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
};

export const updateUser = async (req, res) => {
  const { id } = req.params
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' })
  const result = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const changes = {};
  const updateData = {};
  for (const [key, value] of Object.entries(result.data)) {
    if (value !== undefined && user[key] !== value) {
      changes[key] = { from: user[key], to: value };
      updateData[key] = value;
    }
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ message: 'No changes provided' });
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });

  await prisma.auditLog.create({
    data: {
      action: 'User Updated',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      changes,
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ id: user.id, name: updateData.name || user.name, email: updateData.email || user.email, role: updateData.role || user.role });
};

export const deleteUser = async (req, res) => {
  const { id } = req.params
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' })
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'system_developer') {
    return res.status(403).json({ message: 'Cannot delete system developer accounts' });
  }

  await prisma.user.delete({ where: { id: req.params.id } });

  await prisma.auditLog.create({
    data: {
      action: 'User Deleted',
      entityType: 'User',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { deletedUser: user.email },
      severity: 'Warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'User deleted' });
};

export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
  }

  const changes = {};
  const updateData = {};
  if (name && name !== user.name) {
    changes.name = { from: user.name, to: name };
    updateData.name = name;
  }
  if (email && email !== user.email) {
    changes.email = { from: user.email, to: email };
    updateData.email = email;
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ message: 'No changes provided' });
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });

  await prisma.auditLog.create({
    data: {
      action: 'Profile Updated',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      changes,
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ id: user.id, name: updateData.name || user.name, email: updateData.email || user.email, role: user.role });
};

export const promoteStaff = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' });

  const { role: newRole } = req.body;
  const validRoles = ['front_desk', 'kitchen_view', 'housekeeper_mobile', 'admin', 'manager'];
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  await prisma.user.update({ where: { id }, data: { role: newRole } });

  await prisma.auditLog.create({
    data: {
      action: 'Staff Promoted',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      changes: { role: { from: user.role, to: newRole } },
      severity: 'Security',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ id: user.id, name: user.name, email: user.email, role: newRole });
};

export const suspendUser = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.role === 'system_developer') {
    return res.status(403).json({ message: 'Cannot suspend system developer accounts' });
  }

  if (!user.isActive) {
    return res.status(400).json({ message: 'User is already suspended' });
  }

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: {
      action: 'User Suspended',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      changes: { isActive: { from: true, to: false } },
      severity: 'Security',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'User suspended' });
};

export const reactivateUser = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.isActive) {
    return res.status(400).json({ message: 'User is already active' });
  }

  await prisma.user.update({ where: { id }, data: { isActive: true } });

  await prisma.auditLog.create({
    data: {
      action: 'User Reactivated',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      changes: { isActive: { from: false, to: true } },
      severity: 'Security',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'User reactivated' });
};

export const resetPassword = async (req, res) => {
  const { id } = req.params
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid user ID' })
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  await prisma.auditLog.create({
    data: {
      action: 'Password Reset',
      entityType: 'User',
      entityId: user.id,
      actorId: req.userId,
      severity: 'Security',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'Password reset successfully' });
};
