import { prisma } from '../../../lib/prisma.js';
import { createNotificationSchema, updateNotificationSchema } from '../../../../shared/schemas/notification.schema.js';

export const getUnreadCount = async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      isRead: false,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  res.json({ count });
};

export const getNotifications = async (req, res) => {
  const { type, category, isRead, search } = req.query;
  const where = {};
  if (type) where.type = type;
  if (category) where.category = category;
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const expiryFilter = { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };

  if (search) {
    where.AND = [
      expiryFilter,
      { OR: [{ title: { contains: search, mode: 'insensitive' } }, { message: { contains: search, mode: 'insensitive' } }] },
    ];
  } else {
    Object.assign(where, expiryFilter);
  }

  const items = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(items);
};

export const getNotification = async (req, res) => {
  const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  res.json(item);
};

export const createNotification = async (req, res) => {
  const result = createNotificationSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.notification.create({ data: result.data });
  await prisma.auditLog.create({
    data: {
      action: 'Notification Created',
      entityType: 'Notification',
      entityId: item.id,
      actorId: req.userId,
      changes: { title: item.title },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.status(201).json(item);
};

export const markAsRead = async (req, res) => {
  const item = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  res.json(item);
};

export const markAllAsRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { isRead: false, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    data: { isRead: true },
  });
  await prisma.auditLog.create({
    data: {
      action: 'All Notifications Marked Read',
      entityType: 'Notification',
      entityId: null,
      actorId: req.userId,
      changes: {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json({ message: 'All notifications marked as read' });
};

export const deleteNotification = async (req, res) => {
  const item = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Notification not found' });
  await prisma.notification.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Notification Deleted',
      entityType: 'Notification',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { title: item.title },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Notification deleted' });
};
