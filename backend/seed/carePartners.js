// Local tailor / upcycling-shop directory entries (manually curated mock data,
// as approved for the repair-referral deliverable). Shared by seed/seed.js
// (full reseed) and scripts/seed-care-partners.js (idempotent upsert into an
// existing DB without wiping it).
module.exports = [
  {
    name: 'Queen West Alterations',
    type: 'tailor',
    website: 'https://queenwestalterations.example.com',
    email: 'hello@queenwestalterations.example.com',
    description: 'Same-week repairs, hemming, and zipper replacement',
    location: 'Queen St W, Toronto',
    isActive: true,
  },
  {
    name: 'The Mending Room',
    type: 'tailor',
    website: 'https://themendingroom.example.com',
    email: 'bookings@themendingroom.example.com',
    description: 'Visible mending and denim repair specialists',
    location: 'Kensington Market, Toronto',
    isActive: true,
  },
  {
    name: 'ReStitch Studio',
    type: 'upcycle',
    website: 'https://restitchstudio.example.com',
    email: 'studio@restitchstudio.example.com',
    description: 'Turns damaged garments into new one-of-a-kind pieces',
    location: 'Leslieville, Toronto',
    isActive: true,
  },
  {
    name: 'Second Life Textiles',
    type: 'upcycle',
    website: 'https://secondlifetextiles.example.com',
    email: 'info@secondlifetextiles.example.com',
    description: 'Fabric reclamation and upcycling workshops',
    location: 'Junction Triangle, Toronto',
    isActive: true,
  },
];
