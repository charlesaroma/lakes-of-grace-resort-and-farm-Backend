import { AuditLog } from './auditLog.model.js';

export const getAuditLogs = async (req, res) => {
  const { severity, entityType, limit } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;
  if (entityType) filter.entityType = entityType;
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 100)
    .populate('actorId', 'name email');
  res.json(logs);
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
