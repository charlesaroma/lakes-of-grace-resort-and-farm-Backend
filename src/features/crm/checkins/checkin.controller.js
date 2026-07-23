import { CheckIn } from './checkin.model.js';
import { Room } from '../rooms/room.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { createCheckInSchema, updateCheckInSchema } from '../../../../shared/schemas/checkin.schema.js';

export const getCheckIns = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { guestName: { $regex: search, $options: 'i' } },
      { roomNumber: { $regex: search, $options: 'i' } },
      { guestPhone: { $regex: search, $options: 'i' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    CheckIn.find(filter).sort({ checkInTime: -1 }).skip(skip).limit(limitNum),
    CheckIn.countDocuments(filter),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getCheckIn = async (req, res) => {
  const checkIn = await CheckIn.findById(req.params.id);
  if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });
  res.json(checkIn);
};

export const createCheckIn = async (req, res) => {
  const result = createCheckInSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const active = await CheckIn.findOne({ roomNumber: result.data.roomNumber, status: 'Checked-In' });
  if (active) return res.status(409).json({ message: 'Room is already checked in' });

  const checkIn = await CheckIn.create({
    ...result.data,
    expectedCheckOut: new Date(result.data.expectedCheckOut),
    checkInTime: new Date(),
  });

  await Room.findOneAndUpdate({ roomNumber: result.data.roomNumber }, { status: 'Booked' });

  await AuditLog.create({
    action: 'Guest Checked In',
    entityType: 'CheckIn',
    entityId: checkIn._id,
    actorId: req.userId,
    changes: { guestName: result.data.guestName, roomNumber: result.data.roomNumber },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(checkIn);
};

export const updateCheckIn = async (req, res) => {
  const result = updateCheckInSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const updateData = { ...result.data };
  if (result.data.actualCheckOut) {
    updateData.actualCheckOut = new Date(result.data.actualCheckOut);
    updateData.status = 'Checked-Out';
  }

  const checkIn = await CheckIn.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });

  if (updateData.status === 'Checked-Out') {
    await Room.findOneAndUpdate({ roomNumber: checkIn.roomNumber }, { status: 'Cleaning' });
    await AuditLog.create({
      action: 'Guest Checked Out',
      entityType: 'CheckIn',
      entityId: checkIn._id,
      actorId: req.userId,
      changes: { guestName: checkIn.guestName, roomNumber: checkIn.roomNumber },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    });
  }
  res.json(checkIn);
};

export const deleteCheckIn = async (req, res) => {
  const checkIn = await CheckIn.findByIdAndDelete(req.params.id);
  if (!checkIn) return res.status(404).json({ message: 'Check-in not found' });
  await AuditLog.create({
    action: 'CheckIn Record Deleted',
    entityType: 'CheckIn',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { guestName: checkIn.guestName },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Check-in record deleted' });
};
