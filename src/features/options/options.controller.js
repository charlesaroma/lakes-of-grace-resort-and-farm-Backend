import { prisma } from '../../lib/prisma.js';

const OCCUPANCY_META = {
  Single:       { label: 'Single' },
  Double_Couple: { label: 'Double (Couple)' },
  Double_Twin:  { label: 'Double (Twin)' },
  Shared_3Bed:  { label: 'Shared (3 Beds)' },
  Shared_4Bed:  { label: 'Shared (4 Beds)' },
};

const BOARD_META = {
  FULL: { label: 'Full Board',      description: 'Accommodation + Breakfast, Lunch & Dinner' },
  HALF: { label: 'Half Board',      description: 'Accommodation + Breakfast & 1 Meal' },
  BnB:  { label: 'Bed & Breakfast', description: 'Accommodation + Breakfast only' },
};

const VIEWS = {
  Standard: ['Panorama', 'Lakeview', 'Mulungi'],
  Deluxe:   ['Panorama', 'Lakeview', 'Weaverbird'],
  Premium:  ['Forest', 'Orchard'],
};

const FALLBACK_AREAS       = ['Standard', 'Deluxe', 'Premium'];
const FALLBACK_OCCUPANCIES = Object.entries(OCCUPANCY_META).map(([id, m]) => ({ id, ...m }));
const FALLBACK_BOARD_PLANS = Object.entries(BOARD_META).map(([id, m]) => ({ id, ...m }));

export const getRoomOptions = async (req, res) => {
  const rules = await prisma.roomPricingRule.findMany();

  const pricing = {};
  for (const rule of rules) {
    const { areaOfStay, occupancyType, boardPlan, pricePerNight } = rule;
    if (!pricing[areaOfStay])                 pricing[areaOfStay] = {};
    if (!pricing[areaOfStay][occupancyType])   pricing[areaOfStay][occupancyType] = {};
    pricing[areaOfStay][occupancyType][boardPlan] = pricePerNight;
  }

  const pricingAreas = [...new Set(rules.map(r => r.areaOfStay))];
  const roomRows = await prisma.room.findMany({
    select: { areaOfStay: true },
    distinct: ['areaOfStay'],
  });
  const roomAreas = roomRows.map(r => r.areaOfStay);

  const areas = pricingAreas.length || roomAreas.length
    ? [...new Set([...pricingAreas, ...roomAreas])]
    : FALLBACK_AREAS;

  const dbOccupancies = [...new Set(rules.map(r => r.occupancyType))];
  const occupancies = dbOccupancies.length
    ? dbOccupancies.map(id => ({ id, ...(OCCUPANCY_META[id] || { label: id }) }))
    : FALLBACK_OCCUPANCIES;

  const dbBoardPlans = [...new Set(rules.map(r => r.boardPlan))];
  const boardPlans = dbBoardPlans.length
    ? dbBoardPlans.map(id => ({ id, ...(BOARD_META[id] || { label: id }) }))
    : FALLBACK_BOARD_PLANS;

  res.json({ areas, views: VIEWS, occupancies, boardPlans, pricing });
};
