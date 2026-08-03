export const STATUS = {
  OUT: 'Out of Stock',
  CRITICAL: 'Critical',
  LOW: 'Low Stock',
  OPTIMAL: 'Optimal',
};

export const getStatus = (quantity, threshold) => {
  const qty = quantity ?? 0;
  const thr = threshold ?? 0;
  if (qty <= 0) return STATUS.OUT;
  if (thr > 0 && qty <= Math.floor(thr * 0.25)) return STATUS.CRITICAL;
  if (qty <= thr) return STATUS.LOW;
  return STATUS.OPTIMAL;
};

export const computeDaysLeft = (quantity, avgDailyUsage) => {
  if (!avgDailyUsage || avgDailyUsage <= 0) return null;
  return Math.round((quantity / avgDailyUsage) * 10) / 10;
};

export const suggestedRestockQty = (item, avgDailyUsage) => {
  const parLevel = item?.parLevel ?? 0;
  const qty = item?.quantity ?? 0;
  if (parLevel > 0) return Math.max(0, parLevel - qty);
  if (avgDailyUsage > 0) return Math.max(0, Math.round(avgDailyUsage * 7) - qty);
  return 0;
};
