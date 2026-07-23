import { Room } from './room.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { createRoomSchema, updateRoomSchema } from '../../../../shared/schemas/room.schema.js';

export const getRooms = async (req, res) => {
  const { roomType, status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (roomType) filter.roomType = roomType;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { roomNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    Room.find(filter).sort({ roomNumber: 1 }).skip(skip).limit(limitNum),
    Room.countDocuments(filter),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json(room);
};

export const createRoom = async (req, res) => {
  const result = createRoomSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const existing = await Room.findOne({ roomNumber: result.data.roomNumber });
  if (existing) return res.status(409).json({ message: 'Room number already exists' });

  const room = await Room.create(result.data);
  await AuditLog.create({
    action: 'Room Created',
    entityType: 'Room',
    entityId: room._id,
    actorId: req.userId,
    changes: { roomNumber: room.roomNumber, roomType: room.roomType },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(room);
};

export const updateRoom = async (req, res) => {
  const result = updateRoomSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  if (result.data.roomNumber) {
    const existing = await Room.findOne({ roomNumber: result.data.roomNumber, _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ message: 'Room number already in use' });
  }

  const room = await Room.findByIdAndUpdate(req.params.id, result.data, { new: true, runValidators: true });
  if (!room) return res.status(404).json({ message: 'Room not found' });

  await AuditLog.create({
    action: 'Room Updated',
    entityType: 'Room',
    entityId: room._id,
    actorId: req.userId,
    changes: result.data,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.json(room);
};

export const deleteRoom = async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) return res.status(404).json({ message: 'Room not found' });
  await AuditLog.create({
    action: 'Room Deleted',
    entityType: 'Room',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { roomNumber: room.roomNumber },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Room deleted' });
};
