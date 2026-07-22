import { MenuItem } from './menu.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';

export const getMenuItems = async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { group: { $regex: search, $options: 'i' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort({ category: 1, group: 1, sortOrder: 1 }).skip(skip).limit(limitNum),
    MenuItem.countDocuments(filter),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getMenuItem = async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
};

export const createMenuItem = async (req, res) => {
  const item = await MenuItem.create(req.body);
  await AuditLog.create({
    action: 'Menu Item Added',
    entityType: 'Menu',
    entityId: item._id,
    actorId: req.userId,
    changes: { title: item.title, category: item.category },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(item);
};

export const updateMenuItem = async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  await AuditLog.create({
    action: 'Menu Item Updated',
    entityType: 'Menu',
    entityId: item._id,
    actorId: req.userId,
    changes: req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.json(item);
};

export const getPublicMenuItems = async (req, res) => {
  const items = await MenuItem.find({ status: 'Active' }).sort({ category: 1, group: 1, sortOrder: 1 });
  res.json(items);
};

export const deleteMenuItem = async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  await AuditLog.create({
    action: 'Menu Item Deleted',
    entityType: 'Menu',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { title: item.title },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Menu item deleted' });
};
