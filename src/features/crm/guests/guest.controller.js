import { Guest } from './guest.model.js';

export const getGuests = async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};
  const guests = await Guest.find(filter).sort({ totalBookings: -1 });
  res.json(guests);
};

export const getGuest = async (req, res) => {
  const guest = await Guest.findById(req.params.id);
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json(guest);
};

export const createGuest = async (req, res) => {
  const guest = await Guest.create(req.body);
  res.status(201).json(guest);
};

export const updateGuest = async (req, res) => {
  const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json(guest);
};

export const deleteGuest = async (req, res) => {
  const guest = await Guest.findByIdAndDelete(req.params.id);
  if (!guest) return res.status(404).json({ message: 'Guest not found' });
  res.json({ message: 'Guest deleted' });
};
