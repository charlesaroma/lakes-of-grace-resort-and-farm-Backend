import prisma from '../../lib/prisma.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../../../shared/schemas/department.schema.js';

export const listDepartments = async (req, res) => {
  const [departments, staffCounts] = await Promise.all([
    prisma.department.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.staff.groupBy({ by: ['department'], _count: true }),
  ]);
  const countMap = Object.fromEntries(staffCounts.map(s => [s.department, s._count]));
  departments.forEach(d => { d._count = { staff: countMap[d.name] || 0 }; });
  res.json(departments);
};

export const getDepartment = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid department ID' });
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return res.status(404).json({ message: 'Department not found' });
  const staffCount = await prisma.staff.count({ where: { department: department.name } });
  department._count = { staff: staffCount };
  res.json(department);
};

export const createDepartment = async (req, res) => {
  const result = createDepartmentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const existing = await prisma.department.findUnique({ where: { name: result.data.name } });
  if (existing) return res.status(409).json({ message: 'Department with this name already exists' });

  const department = await prisma.department.create({ data: result.data });

  await prisma.auditLog.create({
    data: {
      action: 'Department Created',
      entityType: 'Staff',
      entityId: department.id,
      actorId: req.userId,
      changes: { name: department.name, color: department.color },
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  req.app.get('io')?.emit?.('department:created', department);
  res.status(201).json(department);
};

export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid department ID' });
  const result = updateDepartmentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return res.status(404).json({ message: 'Department not found' });

  if (result.data.name && result.data.name !== department.name) {
    const existing = await prisma.department.findUnique({ where: { name: result.data.name } });
    if (existing) return res.status(409).json({ message: 'Department with this name already exists' });
  }

  const changes = {};
  for (const [key, value] of Object.entries(result.data)) {
    if (value !== undefined && department[key] !== value) {
      changes[key] = { from: department[key], to: value };
    }
  }

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ message: 'No changes provided' });
  }

  const updated = await prisma.department.update({ where: { id }, data: result.data });

  await prisma.auditLog.create({
    data: {
      action: 'Department Updated',
      entityType: 'Staff',
      entityId: id,
      actorId: req.userId,
      changes,
      severity: 'Info',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  req.app.get('io')?.emit?.('department:updated', updated);
  res.json(updated);
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ message: 'Invalid department ID' });

  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) return res.status(404).json({ message: 'Department not found' });

  const staffCount = await prisma.staff.count({ where: { department: department.name } });
  if (staffCount > 0) {
    return res.status(400).json({
      message: `Cannot delete "${department.name}" — it is assigned to ${department._count.staff} staff member(s). Remove or reassign them first.`,
    });
  }

  await prisma.department.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      action: 'Department Deleted',
      entityType: 'Staff',
      entityId: id,
      actorId: req.userId,
      changes: { deletedDepartment: department.name },
      severity: 'Warning',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  req.app.get('io')?.emit?.('department:deleted', { id });
  res.json({ message: 'Department deleted' });
};
