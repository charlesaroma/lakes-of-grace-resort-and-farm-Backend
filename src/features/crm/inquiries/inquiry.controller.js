import { Inquiry } from './inquiry.model.js';

export const getInquiries = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
  res.json(inquiries);
};

export const getInquiry = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  res.json(inquiry);
};

export const createInquiry = async (req, res) => {
  const inquiry = await Inquiry.create(req.body);
  res.status(201).json(inquiry);
};

export const updateInquiry = async (req, res) => {
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  res.json(inquiry);
};

export const deleteInquiry = async (req, res) => {
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
  res.json({ message: 'Inquiry deleted' });
};
