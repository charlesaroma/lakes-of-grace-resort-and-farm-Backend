import prisma from '../../lib/prisma.js';

export const getMetrics = async (req, res) => {
  const [
    revenueResult,
    activeBookings,
    newInquiries,
    occupiedRooms,
    totalRooms,
  ] = await Promise.all([
    prisma.booking.aggregate({ _sum: { totalAmount: true } }),
    prisma.booking.count({ where: { status: { in: ['Confirmed', 'Checked-In'] } } }),
    prisma.inquiry.count({ where: { status: 'New' } }),
    prisma.room.count({ where: { status: 'Occupied', isStaffResidence: false } }),
    prisma.room.count({ where: { isOutOfInventory: false, isStaffResidence: false } }),
  ]);

  res.json({
    totalRevenue: revenueResult._sum.totalAmount || 0,
    activeBookings,
    newInquiries,
    occupiedRooms,
    totalRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
  });
};
