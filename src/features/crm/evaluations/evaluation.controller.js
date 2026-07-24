import { prisma } from '../../../lib/prisma.js';
import { createEvaluationSchema } from '../../../../shared/schemas/evaluation.schema.js';

export const submitEvaluation = async (req, res) => {
  const result = createEvaluationSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const evaluation = await prisma.evaluation.create({ data: result.data });
  res.status(201).json(evaluation);
};

export const getEvaluations = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;
  const [items, total] = await Promise.all([
    prisma.evaluation.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
    prisma.evaluation.count(),
  ]);
  res.json({ items, total, totalPages: Math.ceil(total / limitNum), page: pageNum });
};

export const getEvaluation = async (req, res) => {
  const evaluation = await prisma.evaluation.findUnique({ where: { id: req.params.id } });
  if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
  res.json(evaluation);
};

export const deleteEvaluation = async (req, res) => {
  const evaluation = await prisma.evaluation.findUnique({ where: { id: req.params.id } });
  if (!evaluation) return res.status(404).json({ message: 'Evaluation not found' });
  await prisma.evaluation.delete({ where: { id: req.params.id } });
  await prisma.auditLog.create({
    data: {
      action: 'Evaluation Deleted',
      entityType: 'Evaluation',
      entityId: req.params.id,
      actorId: req.userId,
      changes: { guestName: `${evaluation.firstName} ${evaluation.lastName}` },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Warning',
    },
  });
  res.json({ message: 'Evaluation deleted' });
};
