import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = ['cottages', 'rooms', 'dining', 'activities'];

async function seed() {
  try {
    const existingCount = await prisma.imageCategory.count();

    if (existingCount > 0) {
      console.log(`Image categories table already has ${existingCount} records. Skipping seed.`);
      await prisma.$disconnect();
      process.exit(0);
    }

    const tagConfig = await prisma.tagConfig.findFirst();
    const tags = tagConfig?.tags?.length ? tagConfig.tags : DEFAULT_CATEGORIES;

    for (const tag of tags) {
      await prisma.imageCategory.create({
        data: { name: tag, description: '' },
      });
    }

    console.log(`Seeded ${tags.length} image categories from tags: ${tags.join(', ')}`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed();
