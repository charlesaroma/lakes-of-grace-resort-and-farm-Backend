import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
    enum: ['User', 'Booking', 'Lead', 'System', 'Payment'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Could be system
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // Store the diff or the payload
  },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
