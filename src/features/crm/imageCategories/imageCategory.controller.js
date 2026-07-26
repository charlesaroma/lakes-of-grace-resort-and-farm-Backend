import { prisma } from '../../../lib/prisma.js';
import { createImageCategorySchema, updateImageCategorySchema, reorderImageCategoriesSchema } from '../../../../shared/schemas/imageCategory.schema.js';

export const getImageCategories = async (req, res) => {
  const items = await prisma.imageCategory.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(items);
};

export const getImageCategory = async (req, res) => {
  const item = await prisma.imageCategory.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Image category not found' });
  res.json(item);
};

export const createImageCategory = async (req, res) => {
  const result = createImageCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const maxSort = await prisma.imageCategory.aggregate({ _max: { sortOrder: true } });
  const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  const item = await prisma.imageCategory.create({ data: { ...result.data, sortOrder: nextSortOrder } });
  req.app.get('io').emit('imageCategories:created', item);
  res.status(201).json(item);
};

export const updateImageCategory = async (req, res) => {
  const result = updateImageCategorySchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const old = await prisma.imageCategory.findUnique({ where: { id: req.params.id } });
  if (!old) return res.status(404).json({ message: 'Image category not found' });

  const item = await prisma.imageCategory.update({ where: { id: req.params.id }, data: result.data });

  if (result.data.name !== undefined && result.data.name !== old.name) {
    await prisma.media.updateMany({
      where: { tag: old.name },
      data: { tag: result.data.name },
    });
    req.app.get('io').emit('media:categoryRenamed');
  }

  req.app.get('io').emit('imageCategories:updated', item);
  res.json(item);
};

export const reorderImageCategories = async (req, res) => {
  const result = reorderImageCategoriesSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });

  await prisma.$transaction(
    result.data.categories.map(({ id, sortOrder }) =>
      prisma.imageCategory.update({ where: { id }, data: { sortOrder } })
    )
  );

  req.app.get('io').emit('imageCategories:reordered');
  res.json({ message: 'Categories reordered' });
};

export const deleteImageCategory = async (req, res) => {
  const item = await prisma.imageCategory.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Image category not found' });
  await prisma.imageCategory.delete({ where: { id: req.params.id } });
  req.app.get('io').emit('imageCategories:deleted', { id: req.params.id });
  res.json({ message: 'Image category deleted' });
};
