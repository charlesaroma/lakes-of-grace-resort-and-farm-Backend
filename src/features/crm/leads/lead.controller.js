import { prisma } from '../../../lib/prisma.js';
import { leadSchema } from '../../../../shared/schemas/lead.schema.js';

export const createLead = async (req, res) => {
  const result = leadSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const lead = await prisma.lead.create({ data: result.data });
  res.status(201).json(lead);
};

export const getLeads = async (req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(leads);
};
