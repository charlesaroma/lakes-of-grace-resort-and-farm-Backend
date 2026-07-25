import { z } from 'zod';

export const createZoneHousekeeperSchema = z.object({
  viewCategory: z.enum(['Panorama', 'Lakeview', 'Weaverbird', 'Mulungi', 'Forest', 'Orchard']),
  housekeeperId: z.string().min(24, 'Invalid ID').max(24, 'Invalid ID'),
  managerId: z.string().min(24, 'Invalid ID').max(24, 'Invalid ID').optional().nullable(),
});

export const updateZoneHousekeeperSchema = createZoneHousekeeperSchema.partial();
