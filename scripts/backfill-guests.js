import { prisma } from '../src/lib/prisma.js';
import { backfillGuests } from '../src/features/crm/guests/guest.service.js';

try {
  const count = await backfillGuests();
  console.log(`Backfill complete: ${count} guest(s) upserted.`);
} finally {
  await prisma.$disconnect();
}
