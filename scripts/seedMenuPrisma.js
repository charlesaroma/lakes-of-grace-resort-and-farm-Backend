import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const menuDataPath = resolve(__dirname, '../prisma/seedMenu.json');
const raw = JSON.parse(readFileSync(menuDataPath, 'utf-8'));

function serializePrices(prices) {
  if (!prices) return null;
  const parts = [];
  if (prices.medium) parts.push(`Medium: ${prices.medium}`);
  if (prices.large) parts.push(`Large: ${prices.large}`);
  return parts.length ? parts.join(', ') : null;
}

function flattenCategories(categories) {
  const items = [];
  let sortOrder = 0;

  for (const cat of categories) {
    if (cat.subCategories) {
      for (const sub of cat.subCategories) {
        for (const item of (sub.items || [])) {
          items.push({
            title: item.name,
            category: cat.category,
            group: sub.name,
            price: item.price || serializePrices(item.prices) || null,
            description: item.description || '',
            sortOrder: sortOrder++,
          });
        }
        for (const addon of (sub.addons || [])) {
          items.push({
            title: addon.name,
            category: cat.category,
            group: sub.name,
            price: addon.price || null,
            description: '',
            sortOrder: sortOrder++,
          });
        }
      }
    } else {
      for (const item of (cat.items || [])) {
        items.push({
          title: item.name,
          category: cat.category,
          price: item.price || serializePrices(item.prices) || null,
          description: item.description || '',
          sortOrder: sortOrder++,
        });
      }
      for (const addon of (cat.addons || [])) {
        items.push({
          title: addon.name,
          category: cat.category,
          price: addon.price || null,
          description: '',
          sortOrder: sortOrder++,
        });
      }
    }
  }

  return items;
}

async function seed() {
  try {
    const count = await prisma.menuItem.count();
    if (count > 0) {
      console.log(`Database already has ${count} menu items. Clearing...`);
      await prisma.menuItem.deleteMany({});
      console.log('Cleared existing menu items.');
    }

    const flatItems = flattenCategories(raw);
    for (const item of flatItems) {
      await prisma.menuItem.create({ data: item });
    }

    console.log(`Inserted ${flatItems.length} menu items.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed();
