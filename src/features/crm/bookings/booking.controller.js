import prisma from '../../../lib/prisma.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const VALID_TRANSITIONS = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Checked-In', 'Cancelled'],
  'Checked-In': ['Checked-Out'],
  'Checked-Out': [],
  'Cancelled': [],
};

function formatBooking(b) {
  const nights = Math.max(1, Math.round((b.checkOut - b.checkIn) / (1000 * 60 * 60 * 24)));
  const dateStr = `${b.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${b.checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  return {
    _id: b.id,
    id: `LOG-${String(b.id).slice(-4).toUpperCase()}`,
    guest: b.guestName,
    email: b.guestEmail,
    areaOfStay: b.areaOfStay,
    occupancy: b.occupancy,
    occupancyDetails: b.occupancyDetails,
    boardType: b.boardType,
    date: dateStr,
    nights,
    status: b.status,
    amount: b.totalAmount,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    guests: b.guests,
    bookingType: b.bookingType,
    rooms: b.rooms,
    phone: b.phone,
    specialRequests: b.specialRequests,
    paymentMethod: b.paymentMethod,
    totalAmount: b.totalAmount,
  };
}

function formatRecentBooking(b) {
  return {
    _id: b.id,
    id: b.id,
    guest: b.guestName,
    areaOfStay: b.areaOfStay,
    date: b.checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: b.status,
  };
}

export const getBookings = async (req, res) => {
  const { status } = req.query;
  const where = status && status !== 'All' ? { status } : {};
  const bookings = await prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' }, include: { checkIns: true } });
  res.json(bookings.map(formatBooking));
};

export const getBooking = async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { checkIns: true } });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json({ ...formatBooking(booking), checkIns: booking.checkIns });
};

export const getRecentBookings = async (req, res) => {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  res.json(bookings.map(formatRecentBooking));
};

export const getRevenueStats = async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const result = await prisma.$runCommandRaw({
    aggregate: 'bookings',
    pipeline: [
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
    ],
    cursor: {},
  });

  const stats = result.cursor.firstBatch;
  const data = stats.map((s) => ({
    month: MONTH_NAMES[s._id.month - 1],
    revenue: s.revenue,
    bookings: s.bookings,
    guests: s.guests,
  }));

  res.json(data);
};

export const createBooking = async (req, res) => {
  const { createBookingSchema } = await import('../../../../shared/schemas/booking.schema.js');
  const result = createBookingSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const booking = await prisma.booking.create({ data: result.data });
  await prisma.auditLog.create({
    data: {
      action: 'Booking Created',
      entityType: 'Booking',
      entityId: booking.id,
      actorId: req.userId,
      changes: { guestName: booking.guestName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  req.app.get('io')?.emit?.('booking:created', formatBooking(booking));
  res.status(201).json(formatBooking(booking));
};

export const updateBooking = async (req, res) => {
  const { updateBookingSchema } = await import('../../../../shared/schemas/booking.schema.js');
  const result = updateBookingSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const existing = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: 'Booking not found' });

  const currentStatus = existing.status;
  const newStatus = result.data.status;

  if (newStatus && newStatus !== currentStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return res.status(400).json({ message: `Cannot transition from '${currentStatus}' to '${newStatus}'` });
    }
  }

  if ((newStatus === 'Confirmed' || currentStatus === 'Confirmed') && result.data.rooms?.length) {
    await prisma.room.updateMany({
      where: { roomNumber: { in: result.data.rooms } },
      data: { status: 'Reserved' },
    });
  }

  if (result.data.status === 'Cancelled' && existing.rooms?.length) {
    await prisma.room.updateMany({
      where: { roomNumber: { in: existing.rooms }, status: 'Reserved' },
      data: { status: 'Available' },
    });
  }

  if (newStatus === 'Checked-In' && currentStatus !== 'Checked-In') {
    const firstRoom = existing.rooms?.[0] || '';
    await prisma.checkIn.create({
      data: {
        guestName: existing.guestName,
        guestPhone: existing.phone || '',
        roomNumber: firstRoom,
        bookingId: existing.id,
        expectedCheckOut: existing.checkOut.toISOString(),
        numberOfGuests: existing.guests || 1,
        status: 'Checked-In',
      },
    });
  }

  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: result.data });
  await prisma.auditLog.create({
    data: {
      action: 'Booking Updated',
      entityType: 'Booking',
      entityId: booking.id,
      actorId: req.userId,
      changes: result.data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'Info',
    },
  });
  req.app.get('io')?.emit?.('booking:updated', formatBooking(booking));
  res.json(formatBooking(booking));
};
