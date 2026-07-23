import { Guideline } from './guideline.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { createGuidelineSchema, updateGuidelineSchema } from '../../../../shared/schemas/guideline.schema.js';

export const getPublicGuidelines = async (req, res) => {
  const guidelines = await Guideline.find().sort({ category: 1, sortOrder: 1 });
  res.json(guidelines);
};

export const getGuidelines = async (req, res) => {
  const { category, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const items = await Guideline.find(filter).sort({ category: 1, sortOrder: 1 });
  res.json(items);
};

export const getGuideline = async (req, res) => {
  const item = await Guideline.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Guideline not found' });
  res.json(item);
};

export const createGuideline = async (req, res) => {
  const result = createGuidelineSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await Guideline.create(result.data);
  await AuditLog.create({
    action: 'Guideline Created',
    entityType: 'Guideline',
    entityId: item._id,
    actorId: req.userId,
    changes: { title: item.title, category: item.category },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(item);
};

export const updateGuideline = async (req, res) => {
  const result = updateGuidelineSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await Guideline.findByIdAndUpdate(req.params.id, result.data, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Guideline not found' });
  await AuditLog.create({
    action: 'Guideline Updated',
    entityType: 'Guideline',
    entityId: item._id,
    actorId: req.userId,
    changes: result.data,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.json(item);
};

export const deleteGuideline = async (req, res) => {
  const item = await Guideline.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Guideline not found' });
  await AuditLog.create({
    action: 'Guideline Deleted',
    entityType: 'Guideline',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { title: item.title },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Guideline deleted' });
};
