import prisma from '../../../lib/prisma.js';

export const getCheckIns = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { guestName: { contains: search, mode: 'insensitive' } },
      { roomNumber: { contains: search, mode: 'insensitive' } },
      { guestPhone: { contains: search, mode: 'insensitive' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.checkIn.findMany({ where, orderBy: { checkInTime: 'desc' }, skip, take: limitNum }),
    prisma.checkIn.count({ where }),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getCheckIn = async (req, res) => {
  const checkIn = await prisma.checkIn.findUnique({ where: { id: req.params.id } });
  if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });
  res.json(checkIn);
};

export const createCheckIn = async (req, res) => {
  const { createCheckInSchema } = await import('../../../../shared/schemas/checkin.schema.js');
  const result = createCheckInSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const active = await prisma.checkIn.findFirst({ where: { roomNumber: result.data.roomNumber, status: 'Checked-In' } });
  if (active) return res.status(409).json({ message: 'Room is already checked in' });

  const checkIn = await prisma.checkIn.create({
    data: {
      ...result.data,
      expectedCheckOut: new Date(result.data.expectedCheckOut),
      checkInTime: new Date(),
    },
  });

  await prisma.room.update({ where: { roomNumber: result.data.roomNumber }, data: { status: 'Booked' } });

  await prisma.auditLog.create({
    data: {
      action: 'Guest Checked In',
      entityType: 'CheckIn',
      entityId: checkIn.id,
      actorId: req.userId,
      changes: { guestName: result.data.guestName, roomNumber: result.data.roomNumber },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(checkIn);
};

export const updateCheckIn = async (req, res) => {
  const { updateCheckInSchema } = await import('../../../../shared/schemas/checkin.schema.js');
  const result = updateCheckInSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const updateData = { ...result.data };
  if (result.data.actualCheckOut) {
    updateData.actualCheckOut = new Date(result.data.actualCheckOut);
    updateData.status = 'Checked-Out';
  }

  const checkIn = await prisma.checkIn.update({ where: { id: req.params.id }, data: updateData });
  if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });

  if (updateData.status === 'Checked-Out') {
    await prisma.room.update({ where: { roomNumber: checkIn.roomNumber }, data: { status: 'Cleaning' } });
    await prisma.auditLog.create({
      data: {
        action: 'Guest Checked Out',
        entityType: 'CheckIn',
        entityId: checkIn.id,
        actorId: req.userId,
        changes: { guestName: checkIn.guestName, roomNumber: checkIn.roomNumber },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: 'Info',
      },
    });
  }
  res.json(checkIn);
};

export const deleteCheckIn = async (req, res) => {
  const checkIn = await prisma.checkIn.findUnique({ where: { id: req.params.id } });
  if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });
  await prisma.checkIn.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'CheckIn Record Deleted',
      entityType: 'CheckIn',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { guestName: checkIn.guestName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Check-in record deleted' });
};
