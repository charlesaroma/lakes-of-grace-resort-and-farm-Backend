import prisma from '../../lib/prisma.js';
import { createStaffSchema, updateStaffSchema } from '../../../shared/schemas/staff.schema.js';

async function validateDepartment(res, department) {
  const dept = await prisma.department.findUnique({ where: { name: department } });
  if (!dept) {
    res.status(400).json({ message: `Department "${department}" does not exist.` });
    return false;
  }
  return true;
}

const staffSelect = {
  id: true, firstName: true, lastName: true, email: true,
  phone: true, photo: true, department: true, position: true,
  employedDate: true, isActive: true, createdAt: true, updatedAt: true,
  userId: true,
};

export const listStaff = async (req, res) => {
  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: 'desc' },
    select: { ...staffSelect, userAccount: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  res.json(staff);
};

export const getStaff = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid staff ID' });
  const staff = await prisma.staff.findUnique({
    where: { id },
    select: { ...staffSelect, userAccount: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  if (!staff) return res.status(404).json({ message: 'Staff not found' });
  res.json(staff);
};

export const createStaff = async (req, res) => {
  const result = createStaffSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { firstName, lastName, email, phone, photo, department, position } = result.data;
  if (!(await validateDepartment(res, department))) return;
  const existing = await prisma.staff.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Staff with this email already exists' });

  const staff = await prisma.staff.create({
    data: { firstName, lastName, email, phone, photo, department, position },
  });

  await prisma.auditLog.create({
    data: {
      action: 'Staff Created',
      entityType: 'Staff',
      entityId: staff.id,
      actorId: req.userId,
      changes: { firstName, lastName, email, department, position },
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.status(201).json(staff);
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid staff ID' });
  const result = updateStaffSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return res.status(404).json({ message: 'Staff not found' });

  if (result.data.department && !(await validateDepartment(res, result.data.department))) return;

  const changes = {};
  const updateData = {};
  for (const [key, value] of Object.entries(result.data)) {
    if (value !== undefined && staff[key] !== value) {
      changes[key] = { from: staff[key], to: value };
      updateData[key] = value;
    }
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ message: 'No changes provided' });
  }

  await prisma.staff.update({ where: { id }, data: updateData });

  await prisma.auditLog.create({
    data: {
      action: 'Staff Updated',
      entityType: 'Staff',
      entityId: id,
      actorId: req.userId,
      changes,
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ id, ...updateData });
};

export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid staff ID' });

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return res.status(404).json({ message: 'Staff not found' });

  if (staff.userId) {
    return res.status(400).json({ message: 'Cannot delete staff linked to a user account. Unlink the user first.' });
  }

  await prisma.staff.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'Staff Deleted',
      entityType: 'Staff',
      entityId: id,
      actorId: req.userId,
      changes: { deletedStaff: staff.email },
      severity: 'Warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'Staff deleted' });
};

export const linkUser = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid staff ID' });
  if (!userId) return res.status(400).json({ message: 'userId is required' });

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return res.status(404).json({ message: 'Staff not found' });

  if (staff.userId) {
    return res.status(400).json({ message: 'Staff already linked to a user' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.staffProfile) {
    return res.status(400).json({ message: 'User already linked to a staff profile' });
  }

  await prisma.staff.update({ where: { id }, data: { userId } });

  await prisma.auditLog.create({
    data: {
      action: 'Staff Linked to User',
      entityType: 'Staff',
      entityId: id,
      actorId: req.userId,
      changes: { staff: staff.email, user: user.email },
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'Staff linked to user' });
};

export const unlinkUser = async (req, res) => {
  const { id } = req.params;

  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid staff ID' });

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) return res.status(404).json({ message: 'Staff not found' });
  if (!staff.userId) return res.status(400).json({ message: 'Staff not linked to any user' });

  await prisma.staff.update({ where: { id }, data: { userId: null } });

  await prisma.auditLog.create({
    data: {
      action: 'Staff Unlinked from User',
      entityType: 'Staff',
      entityId: id,
      actorId: req.userId,
      changes: { staff: staff.email },
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.json({ message: 'Staff unlinked from user' });
};
