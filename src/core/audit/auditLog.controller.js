import { AuditLog } from './auditLog.model.js';

// ─── Handlers ───
export const getAuditLogs = async (req, res) => {
  const { severity, entityType, search, startDate, endDate, page, limit = 20 } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;
  if (entityType) filter.entityType = entityType;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { action: { $regex: search, $options: 'i' } },
      { details: { $regex: search, $options: 'i' } },
      { actorName: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('actorId', 'name email'),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ logs, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getAuditLog = async (req, res) => {
  const log = await AuditLog.findById(req.params.id).populate('actorId', 'name email');
  if (!log) return res.status(404).json({ message: 'Audit log not found' });
  res.json(log);
};

export const getAuditLogsByEntity = async (req, res) => {
  const logs = await AuditLog.find({ entityType: req.params.entityType })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actorId', 'name email');
  res.json(logs);
};
