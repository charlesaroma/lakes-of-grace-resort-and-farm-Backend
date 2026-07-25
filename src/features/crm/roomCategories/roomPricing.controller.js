import { prisma } from '../../../lib/prisma.js';
import { createRoomPricingRuleSchema, updateRoomPricingRuleSchema } from '../../../../shared/schemas/roomPricing.schema.js';

export const getRoomPricingRules = async (req, res) => {
  const { areaOfStay } = req.query;
  const where = {};
  if (areaOfStay) where.areaOfStay = areaOfStay;
  const items = await prisma.roomPricingRule.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(items);
};

export const getRoomPricingRule = async (req, res) => {
  const item = await prisma.roomPricingRule.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Room pricing rule not found' });
  res.json(item);
};

export const createRoomPricingRule = async (req, res) => {
  const result = createRoomPricingRuleSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.roomPricingRule.create({ data: result.data });
  res.status(201).json(item);
};

export const updateRoomPricingRule = async (req, res) => {
  const result = updateRoomPricingRuleSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const item = await prisma.roomPricingRule.update({ where: { id: req.params.id }, data: result.data });
  if (!item) return res.status(404).json({ message: 'Room pricing rule not found' });
  res.json(item);
};

export const deleteRoomPricingRule = async (req, res) => {
  const item = await prisma.roomPricingRule.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Room pricing rule not found' });
  await prisma.roomPricingRule.delete({ where: { id: req.params.id } });
  res.json({ message: 'Room pricing rule deleted' });
};

