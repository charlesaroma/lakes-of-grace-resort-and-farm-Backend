import { z } from 'zod';

export const createRoomPricingRuleSchema = z.object({
  areaOfStay: z.enum(['Standard', 'Deluxe', 'Premium']),
  occupancyType: z.enum(['Single', 'Double_Couple', 'Double_Twin', 'Shared_3Bed', 'Shared_4Bed']),
  boardPlan: z.enum(['FULL', 'HALF', 'BnB']),
  pricePerNight: z.number().min(0, 'Price must be >= 0'),
});

export const updateRoomPricingRuleSchema = createRoomPricingRuleSchema.partial();
