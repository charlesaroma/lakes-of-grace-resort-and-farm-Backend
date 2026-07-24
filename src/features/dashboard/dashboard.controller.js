import prisma from '../../lib/prisma.js';

export const getMetrics = async (req, res) => {
  const [
    revenueResult,
    activeBookings,
    newInquiries,
    totalCottages,
  ] = await Promise.all([
    prisma.booking.aggregate({ _sum: { totalAmount: true } }),
    prisma.booking.count({ where: { status: { in: ['Confirmed', 'Checked-In'] } } }),
    prisma.inquiry.count({ where: { status: 'New' } }),
    prisma.cottage.count(),
  ]);

  res.json({
    totalRevenue: revenueResult._sum.totalAmount || 0,
    activeBookings,
    newInquiries,
    occupancyRate: totalCottages > 0 ? Math.round((activeBookings / totalCottages) * 100) : 0,
  });
};
