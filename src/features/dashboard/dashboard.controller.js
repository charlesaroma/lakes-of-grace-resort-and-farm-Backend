import { Booking } from '../crm/bookings/booking.model.js';
import { Inquiry } from '../crm/inquiries/inquiry.model.js';
import { Cottage } from '../crm/cottages/cottage.model.js';

export const getMetrics = async (req, res) => {
  const [
    revenueResult,
    activeBookings,
    newInquiries,
    totalCottages,
  ] = await Promise.all([
    Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Booking.countDocuments({ status: { $in: ['Confirmed', 'Checked-In'] } }),
    Inquiry.countDocuments({ status: 'New' }),
    Cottage.countDocuments(),
  ]);

  res.json({
    totalRevenue: revenueResult[0]?.total || 0,
    activeBookings,
    newInquiries,
    occupancyRate: totalCottages > 0 ? Math.round((activeBookings / totalCottages) * 100) : 0,
  });
};
