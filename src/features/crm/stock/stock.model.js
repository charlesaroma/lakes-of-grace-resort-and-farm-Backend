import mongoose from 'mongoose';

const stockItemSchema = new mongoose.Schema({
  item: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'pcs', trim: true },
  threshold: { type: Number, required: true, min: 0 },
}, { timestamps: true });

const stockLedgerSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
  item: { type: String, required: true },
  type: { type: String, enum: ['restock', 'dispatch', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  balance: { type: Number, required: true },
  cost: { type: Number },
  supplier: { type: String, trim: true },
  department: { type: String, trim: true },
  purpose: { type: String, trim: true },
  reason: { type: String, trim: true },
  note: { type: String, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

stockItemSchema.index({ item: 1 });
stockLedgerSchema.index({ itemId: 1, createdAt: -1 });

export const StockItem = mongoose.model('StockItem', stockItemSchema);
export const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);
