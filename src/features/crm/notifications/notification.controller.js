import { Notification } from './notification.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { createNotificationSchema, updateNotificationSchema } from '../../../../shared/schemas/notification.schema.js';

export const getUnreadCount = async (req, res) => {
  const unread = { $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }] };
  const count = await Notification.countDocuments({ isRead: false, ...unread.$and[0] });
  res.json({ count });
};

export const getNotifications = async (req, res) => {
  const { type, category, isRead, search } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const expiryFilter = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };

  if (search) {
    filter.$and = [
      expiryFilter,
      { $or: [{ title: { $regex: search, $options: 'i' } }, { message: { $regex: search, $options: 'i' } }] },
    ];
  } else {
    Object.assign(filter, expiryFilter);
  }

  const items = await Notification.find(filter).sort({ createdAt: -1 });
  res.json(items);
};

export const getNotification = async (req, res) => {
  const item = await Notification.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  res.json(item);
};

export const createNotification = async (req, res) => {
  const result = createNotificationSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await Notification.create(result.data);
  await AuditLog.create({
    action: 'Notification Created',
    entityType: 'Notification',
    entityId: item._id,
    actorId: req.userId,
    changes: { title: item.title },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(item);
};

export const markAsRead = async (req, res) => {
  const item = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  res.json(item);
};

export const markAllAsRead = async (req, res) => {
  const expiryFilter = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
  await Notification.updateMany({ isRead: false, ...expiryFilter }, { isRead: true });
  await AuditLog.create({
    action: 'All Notifications Marked Read',
    entityType: 'Notification',
    entityId: null,
    actorId: req.userId,
    changes: {},
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.json({ message: 'All notifications marked as read' });
};

export const deleteNotification = async (req, res) => {
  const item = await Notification.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  await AuditLog.create({
    action: 'Notification Deleted',
    entityType: 'Notification',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { title: item.title },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Notification deleted' });
};
