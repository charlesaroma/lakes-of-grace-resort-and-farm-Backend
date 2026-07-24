import { prisma } from '../../../lib/prisma.js';
import { createConferenceHallSchema, updateConferenceHallSchema } from '../../../../shared/schemas/conferenceHall.schema.js';

export const getPublicHalls = async (req, res) => {
  const halls = await prisma.conferenceHall.findMany({ where: { status: { not: 'Maintenance' } }, orderBy: { name: 'asc' } });
  res.json(halls);
};

export const getHalls = async (req, res) => {
  const { status, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  const items = await prisma.conferenceHall.findMany({ where, orderBy: { name: 'asc' } });
  res.json(items);
};

export const getHall = async (req, res) => {
  const hall = await prisma.conferenceHall.findUnique({ where: { id: req.params.id } });
  if (!hall) return res.status(404).json({ message: 'Conference hall not found' });
  res.json(hall);
};

export const createHall = async (req, res) => {
  const result = createConferenceHallSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const existing = await prisma.conferenceHall.findUnique({ where: { name: result.data.name } });
  if (existing) return res.status(409).json({ message: 'A hall with this name already exists' });

  const hall = await prisma.conferenceHall.create({ data: result.data });
  await prisma.auditLog.create({
    data: {
      action: 'Conference Hall Created',
      entityType: 'ConferenceHall',
      entityId: hall.id,
      actorId: req.userId,
      changes: { name: hall.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(hall);
};

export const updateHall = async (req, res) => {
  const result = updateConferenceHallSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  if (result.data.name) {
    const existing = await prisma.conferenceHall.findFirst({ where: { name: result.data.name, NOT: { id: req.params.id } } });
    if (existing) return res.status(409).json({ message: 'Name already in use' });
  }

  const hall = await prisma.conferenceHall.update({ where: { id: req.params.id }, data: result.data });
  if (!hall) return res.status(404).json({ message: 'Conference hall not found' });

  await prisma.auditLog.create({
    data: {
      action: 'Conference Hall Updated',
      entityType: 'ConferenceHall',
      entityId: hall.id,
      actorId: req.userId,
      changes: result.data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json(hall);
};

export const deleteHall = async (req, res) => {
  const hall = await prisma.conferenceHall.findUnique({ where: { id: req.params.id } });
  if (!hall) return res.status(404).json({ message: 'Conference hall not found' });
  await prisma.conferenceHall.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Conference Hall Deleted',
      entityType: 'ConferenceHall',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { name: hall.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Conference hall deleted' });
};
