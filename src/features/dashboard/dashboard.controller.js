import prisma from '../../lib/prisma.js';

export const getMetrics = async (req, res) => {
  const [
    revenueResult,
    activeBookings,
    newInquiries,
    totalRooms,
  ] = await Promise.all([
    prisma.booking.aggregate({ _sum: { totalAmount: true } }),
    prisma.booking.count({ where: { status: { in: ['Confirmed', 'Checked-In'] } } }),
    prisma.inquiry.count({ where: { status: 'New' } }),
    prisma.room.count(),
  ]);

  res.json({
    totalRevenue: revenueResult._sum.totalAmount || 0,
    activeBookings,
    newInquiries,
    occupancyRate: totalRooms > 0 ? Math.round((activeBookings / totalRooms) * 100) : 0,
  });
};
