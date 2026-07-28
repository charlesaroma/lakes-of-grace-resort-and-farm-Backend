export const getRoomOptions = async (req, res) => {
  const options = {
    areas: ['Standard', 'Deluxe', 'Premium'],
    views: {
      Standard: ['Panorama', 'Lakeview', 'Mulungi'],
      Deluxe: ['Panorama', 'Lakeview', 'Weaverbird'],
      Premium: ['Forest', 'Orchard'],
    },
    occupancies: [
      { id: 'Single', label: 'Single' },
      { id: 'Double_Couple', label: 'Double (Couple)' },
      { id: 'Double_Twin', label: 'Double (Twin)' },
      { id: 'Shared_3Bed', label: 'Shared (3 Beds)' },
      { id: 'Shared_4Bed', label: 'Shared (4 Beds)' },
    ],
    boardPlans: [
      { id: 'FULL', label: 'Full Board', description: 'Accommodation + Breakfast, Lunch & Dinner' },
      { id: 'HALF', label: 'Half Board', description: 'Accommodation + Breakfast & 1 Meal' },
      { id: 'BnB', label: 'Bed & Breakfast', description: 'Accommodation + Breakfast only' },
    ],
  };
  res.json(options);
};
