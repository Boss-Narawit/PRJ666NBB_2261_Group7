const Partner = require('../models/Partner');

// BR30: only active partners are surfaced as export destinations.
// Optional `type` filter (e.g. 'resale', 'donation') narrows the list.
const listActivePartners = async ({ type } = {}) => {
  const query = { isActive: true };
  if (type) query.type = type;
  return Partner.find(query).sort({ name: 1 });
};

module.exports = { listActivePartners };
