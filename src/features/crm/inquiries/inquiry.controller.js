import { prisma } from '../../../lib/prisma.js';

export const getInquiries = async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : {};
  const inquiries = await prisma.inquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(inquiries);
};

export const getInquiry = async (req, res) => {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  res.json(inquiry);
};

export const createInquiry = async (req, res) => {
  const inquiry = await prisma.inquiry.create({ data: req.body });
  res.status(201).json(inquiry);
};

export const updateInquiry = async (req, res) => {
  const inquiry = await prisma.inquiry.update({ where: { id: req.params.id }, data: req.body });
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  res.json(inquiry);
};

export const deleteInquiry = async (req, res) => {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  await prisma.inquiry.delete({ where: { id: req.params.id } });
  res.json({ message: 'Inquiry deleted' });
};
