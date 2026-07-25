import { prisma } from '../../../lib/prisma.js';
import { createZoneHousekeeperSchema, updateZoneHousekeeperSchema } from '../../../../shared/schemas/zoneHousekeeper.schema.js';

export const getZoneHousekeepers = async (req, res) => {
  const items = await prisma.zoneHousekeeper.findMany({
    include: {
      housekeeper: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items);
};

export const getZoneHousekeeper = async (req, res) => {
  const item = await prisma.zoneHousekeeper.findUnique({ 
    where: { id: req.params.id },
    include: {
      housekeeper: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } }
    }
  });
  if (!item) return res.status(404).json({ message: 'Zone assignment not found' });
  res.json(item);
};

export const createZoneHousekeeper = async (req, res) => {
  const result = createZoneHousekeeperSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const existing = await prisma.zoneHousekeeper.findUnique({ where: { viewCategory: result.data.viewCategory } });
  if (existing) return res.status(409).json({ message: 'Zone assignment for this category already exists' });

  const item = await prisma.zoneHousekeeper.create({ 
    data: result.data,
    include: {
      housekeeper: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } }
    }
  });
  res.status(201).json(item);
};

export const updateZoneHousekeeper = async (req, res) => {
  const result = updateZoneHousekeeperSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  if (result.data.viewCategory) {
    const existing = await prisma.zoneHousekeeper.findUnique({ where: { viewCategory: result.data.viewCategory } });
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ message: 'Zone assignment for this category already exists' });
    }
  }

  const item = await prisma.zoneHousekeeper.update({ 
    where: { id: req.params.id }, 
    data: result.data,
    include: {
      housekeeper: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } }
    }
  });
  if (!item) return res.status(404).json({ message: 'Zone assignment not found' });
  res.json(item);
};

export const deleteZoneHousekeeper = async (req, res) => {
  const item = await prisma.zoneHousekeeper.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Zone assignment not found' });
  await prisma.zoneHousekeeper.delete({ where: { id: req.params.id } });
  res.json({ message: 'Zone assignment deleted' });
};
