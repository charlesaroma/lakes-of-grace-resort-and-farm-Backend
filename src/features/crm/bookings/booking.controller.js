import { Booking } from './booking.model.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatBooking(b) {
  const nights = Math.max(1, Math.round((b.checkOut - b.checkIn) / (1000 * 60 * 60 * 24)));
  const dateStr = `${b.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${b.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  return {
    _id: b._id,
    id: `LOG-${String(b._id).slice(-4).toUpperCase()}`,
    guest: b.guestName,
    email: b.guestEmail,
    cottage: b.cottage,
    date: dateStr,
    nights,
    status: b.status,
    amount: b.totalAmount,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests,
  };
}

function formatRecentBooking(b) {
  return {
    _id: b._id,
    id: b._id,
    guest: b.guestName,
    cottage: b.cottage,
    date: b.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: b.status,
  };
}

export const getBookings = async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'All' ? { status } : {};
  const bookings = await Booking.find(filter).sort({ createdAt: -1 });
  res.json(bookings.map(formatBooking));
};

export const getBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(formatBooking(booking));
};

export const getRecentBookings = async (req, res) => {
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5);
  res.json(bookings.map(formatRecentBooking));
};

export const getRevenueStats = async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const pipeline = [
    { $match: { checkIn: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$checkIn' }, month: { $month: '$checkIn' } },
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 },
        guests: { $sum: '$guests' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ];

  const stats = await Booking.aggregate(pipeline);
  const result = stats.map((s) => ({
    month: MONTH_NAMES[s._id.month - 1],
    revenue: s.revenue,
    bookings: s.bookings,
    guests: s.guests,
  }));

  res.json(result);
};
