import prisma from '../../lib/prisma.js';

const actorSelect = { select: { name: true, email: true } };

function auditFilter(params) {
  const { severity, entityType, search, startDate, endDate } = params;
  const where = {};
  if (severity) where.severity = severity;
  if (entityType) where.entityType = entityType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
      { actorName: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export const getAuditLogs = async (req, res) => {
  const { severity, entityType, search, startDate, endDate, page, limit = 20 } = req.query;
  const where = auditFilter({ severity, entityType, search, startDate, endDate });

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: { actor: actorSelect },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ logs, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getAuditLog = async (req, res) => {
  const log = await prisma.auditLog.findUnique({
    where: { id: req.params.id },
    include: { actor: actorSelect },
  });
  if (!log) return res.status(404).json({ message: 'Audit log not found' });
  res.json(log);
};

export const getAuditLogsByEntity = async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { entityType: req.params.entityType },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { actor: actorSelect },
  });
  res.json(logs);
};
