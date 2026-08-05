import { z } from 'zod';

const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  guestName: z.string().optional().default(''),
  guestPhone: z.string().optional().default(''),
  idProof: z.string().optional().default(''),
  numberOfGuests: z.number().int().min(1).optional().default(1),
  vehicleNumber: z.string().optional().default(''),
  status: z.enum(['Pending', 'Checked-In', 'Checked-Out']).optional().default('Pending'),
  checkInTime: z.string().optional(),
  expectedCheckOut: z.string().min(1, 'Expected check-out date is required'),
  actualCheckOut: z.string().optional().nullable(),
  inspection: z.object({
    inspectorName: z.string(),
    items: z.array(z.object({
      area: z.string(),
      status: z.enum(['Passed', 'Needs Attention', 'Failed']),
      remark: z.string().optional(),
    })),
    overallStatus: z.enum(['Passed', 'Needs Attention', 'Failed']),
    notes: z.string().optional(),
    date: z.string(),
  }).optional().nullable(),
});

const baseBookingSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email('Valid email is required'),
  areaOfStay: z.enum(['Standard', 'Deluxe', 'Premium'], { message: 'Area of stay is required' }),
  occupancy: z.enum(['Single', 'Double_Couple', 'Double_Twin', 'Shared_3Bed', 'Shared_4Bed']).default('Single'),
  occupancyDetails: z.string().optional(),
  boardType: z.enum(['FULL', 'HALF', 'BnB']).default('FULL'),
  checkIn: z.coerce.date({ message: 'Check-in date is required' }),
  checkOut: z.coerce.date({ message: 'Check-out date is required' }),
  guests: z.number({ message: 'Number of guests is required' }).int().min(1, 'At least 1 guest required'),
  status: z.enum(['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled']).default('Pending'),
  totalAmount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
  bookingType: z.enum(['Individual', 'Company', 'Organization']).optional().default('Individual'),
  organizationName: z.string().optional(),
  roomsRequested: z.number().int().min(1).optional().default(1),
  rooms: z.array(roomSchema).optional().default([]),
});

export const createBookingSchema = baseBookingSchema.refine(
  (data) => {
    if (data.checkOut <= data.checkIn) return false;
    if ((data.bookingType === 'Company' || data.bookingType === 'Organization') && !data.organizationName) return false;
    return true;
  },
  (data) => {
    if (data.checkOut <= data.checkIn) return { message: 'Check-out must be after check-in', path: ['checkOut'] };
    return { message: 'Organization name is required for company/organization bookings', path: ['organizationName'] };
  },
);

// For updates: make all fields optional AND remove the 'Pending' default from status
// so that omitting status from the request body doesn't inject 'Pending' and
// trigger an invalid state transition (e.g. Checked-In → Pending).
export const updateBookingSchema = baseBookingSchema
  .partial()
  .extend({
    status: z.enum(['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled']).optional(),
  });

export const checkInRoomsSchema = z.object({
  rooms: z.array(z.object({ roomNumber: z.string().min(1, 'Room number is required') }), { message: 'At least one room is required' }).min(1, 'At least one room is required'),
});

export const inspectRoomSchema = z.object({
  inspection: z.object({
    inspectorName: z.string().min(1, 'Inspector name is required'),
    items: z.array(z.object({
      area: z.string().min(1),
      status: z.enum(['Passed', 'Needs Attention', 'Failed']),
      remark: z.string().optional(),
    })),
    overallStatus: z.enum(['Passed', 'Needs Attention', 'Failed']).optional().default('Passed'),
    notes: z.string().optional(),
    date: z.string().optional(),
  }),
  checkOut: z.boolean().optional().default(true),
});

export const extendRoomSchema = z.object({
  expectedCheckOut: z.string().min(1, 'New expected check-out date is required'),
});

export const updateRoomSchema = z.object({
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  idProof: z.string().optional(),
  numberOfGuests: z.number().int().min(1).optional(),
  vehicleNumber: z.string().optional(),
  expectedCheckOut: z.string().optional(),
  roomNumber: z.string().optional(),
});
