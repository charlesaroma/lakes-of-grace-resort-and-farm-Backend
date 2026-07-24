import { prisma } from '../../../lib/prisma.js';

export const getOccupancy = async (req, res) => {
  const cottages = await prisma.cottage.findMany();
  const now = new Date();

  const result = await Promise.all(
    cottages.map(async (c) => {
      const activeBookings = await prisma.booking.count({
        where: {
          cottage: c.name,
          checkIn: { lte: now },
          checkOut: { gte: now },
          status: { in: ['Confirmed', 'Checked-In'] },
        },
      });
      return {
        label: c.label,
        occupied: activeBookings,
        total: c.capacity,
      };
    })
  );

  res.json(result);
};
