import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, trim: true },
  details: { type: String, trim: true },
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'Booking', 'Lead', 'System', 'Payment', 'Stock', 'Menu', 'Guest', 'Media', 'Inquiry'],
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName: { type: String, trim: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  severity: { type: String, enum: ['Info', 'Warning', 'Security', 'Error'], default: 'Info' },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
