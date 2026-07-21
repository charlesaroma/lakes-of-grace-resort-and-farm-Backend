import crypto from 'node:crypto';
import ImageKit from '@imagekit/nodejs';
import { Media } from './media.model.js';
import { TagConfig } from './tagConfig.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { env } from '../../../config/env.js';

const imagekit = new ImageKit({
  publicKey: env.IMAGEKIT_PUBLIC_KEY,
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
});

export const getMedia = async (req, res) => {
  const { tag } = req.query;
  const filter = tag ? { tag: { $regex: `^${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } } : {};
  const items = await Media.find(filter).sort({ createdAt: -1 }).lean();
  res.set('Cache-Control', 'public, max-age=300');
  res.json(items);
};

export const getMediaItem = async (req, res) => {
  const item = await Media.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Media not found' });
  res.json(item);
};

const IMAGEKIT_MAX_BYTES = 25 * 1024 * 1024; // ImageKit free-tier limit

export const createMedia = async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files provided' });
  }

  const tag = (req.body.tag || 'cottages').toLowerCase();
  const uploaded = [];
  const oversized = [];

  for (const file of files) {
    if (file.size > IMAGEKIT_MAX_BYTES) {
      oversized.push(`${file.originalname}: ${(file.size / 1024 / 1024).toFixed(0)}MB exceeds the 25MB limit`);
      continue;
    }

    try {
      const uploadedFile = await imagekit.files.upload({
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
    } catch (err) {
      oversized.push(`${file.originalname}: ${err.message}`);
    }
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

  const result = uploaded.length === 1 ? uploaded[0] : uploaded;
  req.app.get('io').emit('media:created', result);

  if (oversized.length > 0) {
    return res.status(207).json({ uploaded: result, errors: oversized });
  }

  res.status(201).json(result);
};

export const deleteMedia = async (req, res) => {
  const item = await Media.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Media not found' });

  if (item.fileId) {
    try {
      await imagekit.files.delete(item.fileId);
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

  req.app.get('io').emit('media:deleted', { id: req.params.id });
  res.json({ message: 'Media deleted' });
};

export const getAuthParams = (req, res) => {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800;
  const signature = crypto
    .createHmac('sha1', env.IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest('hex');

  res.json({
    token,
    expire,
    signature,
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: env.IMAGEKIT_URL_ENDPOINT,
  });
};

export const updateMedia = async (req, res) => {
  const item = await Media.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ message: 'Media not found' });

  await AuditLog.create({
    action: 'Media Updated',
    entityType: 'Media',
    entityId: req.params.id,
    actorId: req.user?._id,
    changes: req.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });

  req.app.get('io').emit('media:updated', item);
  res.json(item);
};

export const recordMedia = async (req, res) => {
  const { fileId, url, name, tag, size, fileType } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'url is required' });
  }

  const item = await Media.create({
    url,
    fileId: fileId || '',
    tag: (tag || 'cottages').toLowerCase(),
    size: size ? `${(parseInt(size) / 1024).toFixed(0)} KB` : '',
    alt: (name || '').replace(/\.[^/.]+$/, ''),
  });

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

  req.app.get('io').emit('media:created', item);

  res.status(201).json(item);
};

const DEFAULT_TAGS = ['cottages', 'rooms', 'dining', 'activities'];

export const getTagConfig = async (req, res) => {
  let config = await TagConfig.findOne();
  if (!config) {
    config = await TagConfig.create({ tags: DEFAULT_TAGS });
  }
  res.json(config);
};

export const updateTagConfig = async (req, res) => {
  const { tags } = req.body;
  if (!Array.isArray(tags)) {
    return res.status(400).json({ message: 'tags must be an array of strings' });
  }

  let config = await TagConfig.findOne();
  if (!config) {
    config = await TagConfig.create({ tags });
  } else {
    config.tags = tags;
    await config.save();
  }

  await AuditLog.create({
    action: 'Tag Config Updated',
    entityType: 'TagConfig',
    actorId: req.user?._id,
    changes: { tags },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Info',
  });

  res.json(config);
};
