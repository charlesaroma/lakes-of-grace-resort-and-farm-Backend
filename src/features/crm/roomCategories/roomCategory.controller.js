import { prisma } from '../../../lib/prisma.js';
import { createRoomCategorySchema, updateRoomCategorySchema } from '../../../../shared/schemas/roomCategory.schema.js';

export const getRoomCategories = async (req, res) => {
  const { roomType } = req.query;
  const where = {};
  if (roomType) where.roomType = roomType;
  const items = await prisma.roomCategory.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(items);
};

export const getRoomCategory = async (req, res) => {
  const item = await prisma.roomCategory.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Room category not found' });
  res.json(item);
};

export const createRoomCategory = async (req, res) => {
  const result = createRoomCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.roomCategory.create({ data: result.data });
  res.status(201).json(item);
};

export const updateRoomCategory = async (req, res) => {
  const result = updateRoomCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.roomCategory.update({ where: { id: req.params.id }, data: result.data });
  if (!item) return res.status(404).json({ message: 'Room category not found' });
  res.json(item);
};

export const deleteRoomCategory = async (req, res) => {
  const item = await prisma.roomCategory.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Room category not found' });
  await prisma.roomCategory.delete({ where: { id: req.params.id } });
  res.json({ message: 'Room category deleted' });
};
