import { Lead } from './lead.model.js';
import { leadSchema } from '../../../../shared/schemas/lead.schema.js';

export const createLead = async (req, res) => {
  const result = leadSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const lead = await Lead.create(result.data);
  res.status(201).json(lead);
};

export const getLeads = async (req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json(leads);
};
