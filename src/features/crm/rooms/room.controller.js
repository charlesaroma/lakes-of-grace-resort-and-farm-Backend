import prisma from '../../../lib/prisma.js';

export const getRooms = async (req, res) => {
  const { roomType, status, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (roomType) where.roomType = roomType;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { roomNumber: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.room.findMany({ where, orderBy: { roomNumber: 'asc' }, skip, take: limitNum }),
    prisma.room.count({ where }),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getRoom = async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
};

export const createRoom = async (req, res) => {
  const { createRoomSchema } = await import('../../../../shared/schemas/room.schema.js');
  const result = createRoomSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const existing = await prisma.room.findFirst({ where: { roomNumber: result.data.roomNumber } });
  if (existing) return res.status(409).json({ message: 'Room number already exists' });

  const room = await prisma.room.create({ data: result.data });
  await prisma.auditLog.create({
    data: {
      action: 'Room Created',
      entityType: 'Room',
      entityId: room.id,
      actorId: req.userId,
      changes: { roomNumber: room.roomNumber, roomType: room.roomType },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(room);
};

export const updateRoom = async (req, res) => {
  const { updateRoomSchema } = await import('../../../../shared/schemas/room.schema.js');
  const result = updateRoomSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  if (result.data.roomNumber) {
    const existing = await prisma.room.findFirst({ where: { roomNumber: result.data.roomNumber, NOT: { id: req.params.id } } });
    if (existing) return res.status(409).json({ message: 'Room number already in use' });
  }

  const room = await prisma.room.update({ where: { id: req.params.id }, data: result.data });
  if (!room) return res.status(404).json({ message: 'Room not found' });

  await prisma.auditLog.create({
    data: {
      action: 'Room Updated',
      entityType: 'Room',
      entityId: room.id,
      actorId: req.userId,
      changes: result.data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json(room);
};

export const deleteRoom = async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  await prisma.room.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Room Deleted',
      entityType: 'Room',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { roomNumber: room.roomNumber },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Room deleted' });
};
