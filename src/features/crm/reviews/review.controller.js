import { Review } from './review.model.js';
import { AuditLog } from '../../../core/audit/auditLog.model.js';
import { createReviewSchema, updateReviewSchema } from '../../../../shared/schemas/review.schema.js';

export const getPublicReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    Review.find({ status: 'Published' }).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Review.countDocuments({ status: 'Published' }),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getHomePageReviews = async (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
  const [items, total] = await Promise.all([
    Review.find({ status: 'Published', showOnHomePage: true })
      .sort({ createdAt: -1 })
      .limit(limitNum),
    Review.countDocuments({ status: 'Published', showOnHomePage: true }),
  ]);
  res.json({ items, total });
};

export const getReviews = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Review.countDocuments(filter),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const submitReview = async (req, res) => {
  const result = createReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const review = await Review.create(result.data);
  res.status(201).json(review);
};

export const getReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json(review);
};

export const updateReview = async (req, res) => {
  const result = updateReviewSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const review = await Review.findByIdAndUpdate(req.params.id, result.data, { new: true, runValidators: true });
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (result.data.status || 'showOnHomePage' in (result.data || {})) {
    await AuditLog.create({
      action: result.data.status ? 'Review Status Changed' : 'Review Updated',
      entityType: 'Review',
      entityId: review._id,
      actorId: req.userId,
      changes: {
        ...(result.data.status ? { status: result.data.status } : {}),
        ...('showOnHomePage' in result.data ? { showOnHomePage: result.data.showOnHomePage } : {}),
        guestName: `${review.firstName} ${review.lastName}`,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: result.data.status === 'Published' ? 'Info' : result.data.status === 'Rejected' ? 'Warning' : 'Info',
    });
  } else {
    await AuditLog.create({
      action: 'Review Updated',
      entityType: 'Review',
      entityId: review._id,
      actorId: req.userId,
      changes: result.data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    });
  }
  res.json(review);
};

export const deleteReview = async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });
  await AuditLog.create({
    action: 'Review Deleted',
    entityType: 'Review',
    entityId: req.params.id,
    actorId: req.userId,
    changes: { guestName: `${review.firstName} ${review.lastName}` },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    severity: 'Warning',
  });
  res.json({ message: 'Review deleted' });
};
