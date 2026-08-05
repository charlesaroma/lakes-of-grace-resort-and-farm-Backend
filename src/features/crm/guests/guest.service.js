import { prisma } from '../../../lib/prisma.js';

export async function syncGuestFromBooking(booking, io) {
  if (!booking?.guestEmail) return null;

  const email = booking.guestEmail.trim();
  const stats = await prisma.booking.aggregate({
    where: { guestEmail: email },
    _count: { _all: true },
    _sum: { totalAmount: true },
    _max: { checkIn: true },
  });

  const guest = await prisma.guest.upsert({
    where: { email },
    create: {
      name: booking.guestName,
      email,
      phone: booking.phone || '',
      totalBookings: stats._count._all,
      lastStay: stats._max.checkIn,
      totalSpend: stats._sum.totalAmount || 0,
    },
    update: {
      name: booking.guestName,
      phone: booking.phone || undefined,
      totalBookings: stats._count._all,
      lastStay: stats._max.checkIn,
      totalSpend: stats._sum.totalAmount || 0,
    },
  });

  io?.emit?.('guest:upserted', guest);
  return guest;
}

export async function backfillGuests(io) {
  const bookings = await prisma.booking.findMany({
    select: { guestEmail: true, guestName: true, phone: true, checkIn: true, totalAmount: true },
    orderBy: { checkIn: 'desc' },
  });

  const byEmail = new Map();
  for (const b of bookings) {
    if (!b.guestEmail) continue;
    const email = b.guestEmail.trim();
    const agg = byEmail.get(email);
    if (agg) {
      agg.totalBookings += 1;
      agg.totalSpend += b.totalAmount || 0;
    } else {
      byEmail.set(email, {
        email,
        name: b.guestName,
        phone: b.phone || '',
        totalBookings: 1,
        lastStay: b.checkIn,
        totalSpend: b.totalAmount || 0,
      });
    }
  }

  let count = 0;
  for (const data of byEmail.values()) {
    await prisma.guest.upsert({
      where: { email: data.email },
      create: { ...data },
      update: {
        name: data.name,
        phone: data.phone || undefined,
        totalBookings: data.totalBookings,
        lastStay: data.lastStay,
        totalSpend: data.totalSpend,
      },
    });
    count += 1;
  }

  io?.emit?.('guest:upserted', { count });
  return count;
}
