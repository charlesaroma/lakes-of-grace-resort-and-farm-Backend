import { Media } from './media.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';

export const getMedia = async (req, res) => {
  const { tag } = req.query;
  const filter = tag ? { tag } : {};
  const items = await Media.find(filter).sort({ createdAt: -1 });
  res.json(items);
};

export const getMediaItem = async (req, res) => {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Media not found' });
  res.json(item);
};

export const createMedia = async (req, res) => {
  const item = await Media.create(req.body);
  await AuditLog.create({
    action: 'Media Upload',
    entityType: 'Media',
    entityId: item._id,
    actorId: req.user?._id,
    changes: { url: item.url, tag: item.tag },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });
  res.status(201).json(item);
};

export const deleteMedia = async (req, res) => {
  const item = await Media.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Media not found' });
  await AuditLog.create({
    action: 'Media Deleted',
    entityType: 'Media',
    entityId: req.params.id,
    actorId: req.user?._id,
    changes: { url: item.url },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Media deleted' });
};
