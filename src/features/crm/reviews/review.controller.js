import { prisma } from '../../../lib/prisma.js';
import { createReviewSchema, updateReviewSchema } from '../../../../shared/schemas/review.schema.js';

export const getPublicReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const where = { status: 'Published' };
  const [items, total] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
    prisma.review.count({ where }),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getHomePageReviews = async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const where = { status: 'Published', showOnHomePage: true };
  const [items, total] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, take: limitNum }),
    prisma.review.count({ where }),
  ]);
  res.json({ items, total });
};

export const getReviews = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { comment: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
    prisma.review.count({ where }),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const submitReview = async (req, res) => {
  const result = createReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const review = await prisma.review.create({ data: result.data });
  res.status(201).json(review);
};

export const getReview = async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json(review);
};

export const updateReview = async (req, res) => {
  const result = updateReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const review = await prisma.review.update({ where: { id: req.params.id }, data: result.data });
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (result.data.status || 'showOnHomePage' in (result.data || {})) {
    await prisma.auditLog.create({
      data: {
        action: result.data.status ? 'Review Status Changed' : 'Review Updated',
        entityType: 'Review',
        entityId: review.id,
        actorId: req.userId,
        changes: {
          ...(result.data.status ? { status: result.data.status } : {}),
          ...('showOnHomePage' in result.data ? { showOnHomePage: result.data.showOnHomePage } : {}),
          guestName: `${review.firstName} ${review.lastName}`,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: result.data.status === 'Published' ? 'Info' : result.data.status === 'Rejected' ? 'Warning' : 'Info',
      },
    });
  } else {
    await prisma.auditLog.create({
      data: {
        action: 'Review Updated',
        entityType: 'Review',
        entityId: review.id,
        actorId: req.userId,
        changes: result.data,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: 'Info',
      },
    });
  }
  res.json(review);
};

export const approveReview = async (req, res) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: 'Published' } });
  if (!review) return res.status(404).json({ message: 'Review not found' });
  await prisma.auditLog.create({
    data: {
      action: 'Review Approved',
      entityType: 'Review',
      entityId: review.id,
      actorId: req.userId,
      changes: { status: 'Published', guestName: `${review.firstName} ${review.lastName}` },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  res.json(review);
};

export const rejectReview = async (req, res) => {
  const review = await prisma.review.update({ where: { id: req.params.id }, data: { status: 'Rejected' } });
  if (!review) return res.status(404).json({ message: 'Review not found' });
  await prisma.auditLog.create({
    data: {
      action: 'Review Rejected',
      entityType: 'Review',
      entityId: review.id,
      actorId: req.userId,
      changes: { status: 'Rejected', guestName: `${review.firstName} ${review.lastName}` },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json(review);
};

export const deleteReview = async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ message: 'Review not found' });
  await prisma.review.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Review Deleted',
      entityType: 'Review',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { guestName: `${review.firstName} ${review.lastName}` },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Review deleted' });
};
