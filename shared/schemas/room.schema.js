import { z } from 'zod';

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  roomName: z.string().optional().default(''),
  areaOfStay: z.enum(['Standard', 'Deluxe', 'Premium']).default('Standard'),
  viewCategory: z.enum(['Panorama', 'Lakeview', 'Weaverbird', 'Mulungi', 'Forest', 'Orchard']).optional(),
  status: z.enum(['Available', 'Occupied', 'Maintenance', 'Reserved']).default('Available'),
  occupancyTypes: z.array(z.enum(['Single', 'Double_Couple', 'Double_Twin', 'Shared_3Bed', 'Shared_4Bed'])).default([]),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').default(2),
  isStaffResidence: z.boolean().default(false),
  isVipSuite: z.boolean().default(false),
  isOutOfInventory: z.boolean().default(false),
  housekeeper: z.string().optional().nullable(),
  manager: z.string().optional().nullable(),
  customFullBoardRate: z.number().min(0, 'Rate must be >= 0').optional().nullable(),
  customHalfBoardRate: z.number().min(0, 'Rate must be >= 0').optional().nullable(),
  customBnBRate: z.number().min(0, 'Rate must be >= 0').optional().nullable(),
  description: z.string().optional().default(''),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
});

export const updateRoomSchema = createRoomSchema.partial();
