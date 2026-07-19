import { MenuItem } from './menu.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';

export const getMenuItems = async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const items = await MenuItem.find(filter).sort({ category: 1, group: 1, sortOrder: 1 });
  res.json(items);
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
    actorId: req.user?._id,
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
    actorId: req.user?._id,
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
    actorId: req.user?._id,
    changes: { title: item.title },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Menu item deleted' });
};
