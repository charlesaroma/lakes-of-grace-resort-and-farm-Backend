import { ConferenceHall } from './conferenceHall.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { createConferenceHallSchema, updateConferenceHallSchema } from '../../../../shared/schemas/conferenceHall.schema.js';

export const getPublicHalls = async (req, res) => {
  const halls = await ConferenceHall.find({ status: { $ne: 'Maintenance' } }).sort({ name: 1 });
  res.json(halls);
};

export const getHalls = async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const items = await ConferenceHall.find(filter).sort({ name: 1 });
  res.json(items);
};

export const getHall = async (req, res) => {
  const hall = await ConferenceHall.findById(req.params.id);
  if (!hall) return res.status(404).json({ message: 'Conference hall not found' });
  res.json(hall);
};

export const createHall = async (req, res) => {
  const result = createConferenceHallSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const existing = await ConferenceHall.findOne({ name: result.data.name });
  if (existing) return res.status(409).json({ message: 'A hall with this name already exists' });

  const hall = await ConferenceHall.create(result.data);
  await AuditLog.create({
    action: 'Conference Hall Created',
    entityType: 'ConferenceHall',
    entityId: hall._id,
    actorId: req.userId,
    changes: { name: hall.name },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(hall);
};

export const updateHall = async (req, res) => {
  const result = updateConferenceHallSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  if (result.data.name) {
    const existing = await ConferenceHall.findOne({ name: result.data.name, _id: { $ne: req.params.id } });
    if (existing) return res.status(409).json({ message: 'Name already in use' });
  }

  const hall = await ConferenceHall.findByIdAndUpdate(req.params.id, result.data, { new: true, runValidators: true });
  if (!hall) return res.status(404).json({ message: 'Conference hall not found' });

  await AuditLog.create({
    action: 'Conference Hall Updated',
    entityType: 'ConferenceHall',
    entityId: hall._id,
    actorId: req.userId,
    changes: result.data,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.json(hall);
};

export const deleteHall = async (req, res) => {
  const hall = await ConferenceHall.findByIdAndDelete(req.params.id);
  if (!hall) return res.status(404).json({ message: 'Conference hall not found' });
  await AuditLog.create({
    action: 'Conference Hall Deleted',
    entityType: 'ConferenceHall',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { name: hall.name },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Conference hall deleted' });
};
