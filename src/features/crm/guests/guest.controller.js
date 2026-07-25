import { prisma } from '../../../lib/prisma.js';

export const getGuests = async (req, res) => {
  const { search } = req.query;
  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
    : {};
  const guests = await prisma.guest.findMany({ where, orderBy: { totalBookings: 'desc' } });
  res.json(guests);
};

export const getGuest = async (req, res) => {
  const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json(guest);
};

export const createGuest = async (req, res) => {
  const guest = await prisma.guest.create({ data: req.body });
  req.app.get('io')?.emit?.('guest:created', guest);
  res.status(201).json(guest);
};

export const updateGuest = async (req, res) => {
  const guest = await prisma.guest.update({ where: { id: req.params.id }, data: req.body });
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  req.app.get('io')?.emit?.('guest:updated', guest);
  res.json(guest);
};

export const deleteGuest = async (req, res) => {
  const guest = await prisma.guest.findUnique({ where: { id: req.params.id } });
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  await prisma.guest.delete({ where: { id: req.params.id } });
  req.app.get('io')?.emit?.('guest:deleted', { id: req.params.id });
  res.json({ message: 'Guest deleted' });
};
