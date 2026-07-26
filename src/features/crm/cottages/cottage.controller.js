import prisma from '../../../lib/prisma.js';

export const getOccupancy = async (req, res) => {
  const now = new Date();

  const [rooms, activeBookings] = await Promise.all([
    prisma.room.findMany({
      where: { isStaffResidence: false, isOutOfInventory: false },
      select: { areaOfStay: true },
    }),
    prisma.booking.findMany({
      where: {
        checkIn: { lte: now },
        checkOut: { gte: now },
        status: { notIn: ['Cancelled', 'Completed'] },
        areaOfStay: { not: null },
      },
      select: { areaOfStay: true },
    }),
  ]);

  const totalMap = {};
  for (const r of rooms) {
    const key = r.areaOfStay || 'Unassigned';
    totalMap[key] = (totalMap[key] || 0) + 1;
  }

  const occupiedMap = {};
  for (const b of activeBookings) {
    const key = b.areaOfStay || 'Unassigned';
    occupiedMap[key] = (occupiedMap[key] || 0) + 1;
  }

  const areas = [...new Set([...Object.keys(totalMap), ...Object.keys(occupiedMap)])].sort();

  const result = areas.map((label) => ({
    label,
    occupied: Math.min(occupiedMap[label] || 0, totalMap[label] || 0),
    total: totalMap[label] || 0,
  }));

  res.json(result);
};
