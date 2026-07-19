import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is required');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDataPath = resolve(__dirname, '../../lakes-of-grace-resort-frontend/src/data/diningMenu.json');
const raw = JSON.parse(readFileSync(frontendDataPath, 'utf-8'));

const menuItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String, trim: true },
  group: { type: String, trim: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

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
            price: item.price || serializePrices(item.prices) || undefined,
            description: item.description || '',
            sortOrder: sortOrder++,
          });
        }
      }
    } else {
      for (const item of (cat.items || [])) {
        items.push({
          title: item.name,
          category: cat.category,
          price: item.price || serializePrices(item.prices) || undefined,
          description: item.description || '',
          sortOrder: sortOrder++,
        });
      }
    }
  }

  return items;
}

function serializePrices(prices) {
  if (!prices) return '';
  const parts = [];
  if (prices.medium) parts.push(`Medium: ${prices.medium}`);
  if (prices.large) parts.push(`Large: ${prices.large}`);
  return parts.join(', ');
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    const flatItems = flattenCategories(raw);
    await MenuItem.insertMany(flatItems);
    console.log(`Inserted ${flatItems.length} menu items`);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
