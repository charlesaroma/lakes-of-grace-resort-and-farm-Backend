import ImageKit from '@imagekit/nodejs';
import { Media } from './media.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { env } from '../../../config/env.js';

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

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
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files provided' });
  }

  const tag = req.body.tag || 'gallery';
  const uploaded = [];

  for (const file of files) {
    const uploadedFile = await imagekit.upload({
      file: file.buffer,
      fileName: file.originalname,
      folder: '/lakes-of-grace-farm-resort/crm-media',
      useUniqueFileName: true,
    });

    const item = await Media.create({
      url: uploadedFile.url,
      fileId: uploadedFile.fileId,
      tag,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      alt: file.originalname.replace(/\.[^/.]+$/, ''),
    });

    uploaded.push(item);
  }

  await AuditLog.create({
    action: 'Media Upload',
    entityType: 'Media',
    entityId: uploaded.map((i) => i._id).join(','),
    actorId: req.user?._id,
    changes: { urls: uploaded.map((i) => i.url), tag },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });

  res.status(201).json(uploaded.length === 1 ? uploaded[0] : uploaded);
};

export const deleteMedia = async (req, res) => {
  const item = await Media.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Media not found' });

  if (item.fileId) {
    try {
      await imagekit.deleteFile(item.fileId);
    } catch (err) {
      console.error('Failed to delete file from ImageKit:', err.message);
    }
  }

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
