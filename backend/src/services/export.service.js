const Export = require('../models/Export');
const Clothing = require('../models/Clothing');
const Partner = require('../models/Partner');
const { withTransaction } = require('../config/db');

const fail = (message, status) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};

// Creates an export of one clothing item to a partner and archives the item.
// Enforces BR6, BR17, BR20, BR21, BR22, BR30. Resale/donation share this path —
// the controller fixes `type` per route.
const createExport = async (userId, data) => {
  const { clothingId, partnerId, type, price, description, selectedFields } = data;
  const checklistCompleted = data.checklistCompleted === true;
  const consent = data.consent === true;

  // BR17/BR20: export requires a completed checklist and explicit consent.
  if (!checklistCompleted) fail('Checklist must be completed before export', 422);
  if (!consent) fail('User consent is required before export', 422);

  const clothing = await Clothing.findOne({ _id: clothingId, userId });
  if (!clothing) fail('Clothing item not found', 404);

  // Only an active-wardrobe item can be exported — prevents duplicate exports
  // and double-archiving an item that already left the wardrobe (BR23).
  if (clothing.status !== 'Available') fail('Item is not available for export', 422);

  // BR6: no image, no export.
  if (!clothing.imageUrl) fail('Item has no image and cannot be exported', 422);

  // BR30: deactivated partners are not valid export destinations.
  const partner = await Partner.findById(partnerId);
  if (!partner || !partner.isActive) fail('Partner not found', 404);

  // The destination must actually offer this kind of export.
  if (partner.type !== type) fail(`Partner does not accept ${type} exports`, 422);

  // BR21: damaged items cannot be exported to resale partners.
  if (clothing.condition === 'Damaged' && partner.type === 'resale') {
    fail('Damaged items cannot be exported to resale partners', 422);
  }

  return withTransaction(async (session) => {
    // Re-claim the item inside the transaction: two concurrent submits (e.g. a
    // double-tap) both pass the pre-checks above, so this conditional update is
    // the authoritative guard — the loser finds no Available doc and fails
    // without creating a second Export.
    //
    // The item leaves the active wardrobe once exported (keeps BR23 utilization
    // honest). 'Exported' is distinct from 'Archived' so the UI can show where
    // it went; exportInfo caches the destination for display (Export is the
    // authoritative record).
    const claimed = await Clothing.findOneAndUpdate(
      { _id: clothingId, userId, status: 'Available' },
      {
        $set: {
          status: 'Exported',
          exportInfo: {
            partnerName: partner.name,
            type,
            exportedAt: new Date(),
          },
        },
      },
      { session, new: true }
    );
    if (!claimed) fail('Item is not available for export', 422);

    const [created] = await Export.create(
      [
        {
          userId,
          clothingId,
          partnerId,
          type,
          price,
          description,
          checklistCompleted,
          consent,
          selectedFields: Array.isArray(selectedFields) ? selectedFields : [], // BR22
          status: 'active',
        },
      ],
      { session }
    );

    return created;
  });
};

const listExports = async (userId) =>
  Export.find({ userId })
    .sort({ createdAt: -1 })
    .populate('clothingId', 'name brand imageUrl')
    .populate('partnerId', 'name type');

module.exports = { createExport, listExports };
