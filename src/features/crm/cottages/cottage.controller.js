import { Cottage } from './cottage.model.js';
import { Booking } from '../bookings/booking.model.js';

export const getOccupancy = async (req, res) => {
  const cottages = await Cottage.find();
  const now = new Date();

  const result = await Promise.all(
    cottages.map(async (c) => {
      const activeBookings = await Booking.countDocuments({
        cottage: c.name,
        checkIn: { $lte: now },
        checkOut: { $gte: now },
        status: { $in: ['Confirmed', 'Checked-In'] },
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
