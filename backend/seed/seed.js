require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Clothing = require('../src/models/Clothing');
const Outfit = require('../src/models/Outfit');
const WearLog = require('../src/models/WearLog');
const ThoughtfulPurchase = require('../src/models/ThoughtfulPurchase');
const SimilarityCheck = require('../src/models/SimilarityCheck');
const Partner = require('../src/models/Partner');
const Export = require('../src/models/Export');
const Notification = require('../src/models/Notification');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data (idempotent)
  await Promise.all([
    User.deleteMany({}),
    Clothing.deleteMany({}),
    Outfit.deleteMany({}),
    WearLog.deleteMany({}),
    ThoughtfulPurchase.deleteMany({}),
    SimilarityCheck.deleteMany({}),
    Partner.deleteMany({}),
    Export.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const [admin, user1] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@redrobe.com',
      password: passwordHash,
      role: 'admin',
      preferences: { forgottenItemThresholdDays: 30 },
    },
    {
      name: 'Jane Doe',
      email: 'jane@redrobe.com',
      password: passwordHash,
      role: 'user',
      notificationEnabled: true,
      preferences: {
        favoriteColors: ['black', 'white', 'navy'],
        favoriteCategories: ['tops', 'dresses'],
        forgottenItemThresholdDays: 45,
      },
    },
  ]);
  console.log('Users:', admin._id, user1._id);

  // Clothing items
  const clothingDocs = await Clothing.insertMany([
    {
      userId: user1._id,
      name: 'White Cotton Tee',
      brand: 'Uniqlo',
      category: 'tops',
      colors: ['white'],
      size: 'M',
      imageUrl: 'https://example.com/images/white-tee.jpg',
      condition: 'Good',
      status: 'Available',
      purchasePrice: 19.9,
      purchaseDate: new Date('2024-03-01'),
      tags: ['casual', 'basics'],
      analytics: { wearCount: 12 },
    },
    {
      userId: user1._id,
      name: 'Black Slim Jeans',
      brand: "Levi's",
      category: 'bottoms',
      colors: ['black'],
      size: '28',
      imageUrl: 'https://example.com/images/black-jeans.jpg',
      condition: 'Good',
      status: 'Available',
      purchasePrice: 79.0,
      purchaseDate: new Date('2023-11-15'),
      tags: ['casual', 'versatile'],
      analytics: { wearCount: 20, lastWornAt: new Date('2025-05-10') },
    },
    {
      userId: user1._id,
      name: 'Floral Midi Dress',
      brand: 'Zara',
      category: 'dresses',
      colors: ['pink', 'white'],
      size: 'S',
      imageUrl: 'https://example.com/images/floral-dress.jpg',
      condition: 'Excellent',
      status: 'Available',
      purchasePrice: 59.9,
      purchaseDate: new Date('2024-04-20'),
      tags: ['summer', 'date'],
      analytics: { wearCount: 3 },
    },
    {
      userId: user1._id,
      name: 'Navy Blazer',
      brand: 'J.Crew',
      category: 'outerwear',
      colors: ['navy'],
      size: 'M',
      imageUrl: 'https://example.com/images/navy-blazer.jpg',
      condition: 'Excellent',
      status: 'Available',
      purchasePrice: 120.0,
      purchaseDate: new Date('2023-09-01'),
      tags: ['work', 'formal'],
      analytics: { wearCount: 8 },
    },
    {
      userId: user1._id,
      name: 'White Sneakers',
      brand: 'Nike',
      category: 'shoes',
      colors: ['white'],
      size: '7',
      imageUrl: 'https://example.com/images/white-sneakers.jpg',
      condition: 'Good',
      status: 'Available',
      purchasePrice: 90.0,
      tags: ['casual', 'everyday'],
      analytics: { wearCount: 30, lastWornAt: new Date('2025-05-14') },
    },
    {
      userId: user1._id,
      name: 'Silk Scarf',
      brand: 'H&M',
      category: 'accessories',
      colors: ['multicolor'],
      size: 'One Size',
      imageUrl: 'https://example.com/images/silk-scarf.jpg',
      condition: 'Excellent',
      status: 'Available',
      purchasePrice: 25.0,
      tags: ['accessories'],
      analytics: { wearCount: 0 },
    },
    {
      userId: user1._id,
      name: 'Grey Hoodie',
      brand: 'Champion',
      category: 'tops',
      colors: ['grey'],
      size: 'L',
      imageUrl: 'https://example.com/images/grey-hoodie.jpg',
      condition: 'Fair',
      status: 'Available',
      purchasePrice: 45.0,
      tags: ['casual', 'winter'],
      analytics: { wearCount: 15 },
    },
    {
      userId: user1._id,
      name: 'Pleated Skirt',
      brand: 'Mango',
      category: 'bottoms',
      colors: ['beige'],
      size: 'S',
      imageUrl: 'https://example.com/images/pleated-skirt.jpg',
      condition: 'Good',
      status: 'Available',
      purchasePrice: 39.9,
      tags: ['work', 'smart casual'],
      analytics: { wearCount: 5 },
    },
    {
      userId: user1._id,
      name: 'Leather Ankle Boots',
      brand: 'Steve Madden',
      category: 'shoes',
      colors: ['brown'],
      size: '7',
      imageUrl: 'https://example.com/images/ankle-boots.jpg',
      condition: 'Good',
      status: 'Available',
      purchasePrice: 110.0,
      tags: ['fall', 'winter'],
      analytics: { wearCount: 9 },
    },
    {
      userId: user1._id,
      name: 'Denim Jacket',
      brand: 'Gap',
      category: 'outerwear',
      colors: ['blue'],
      size: 'M',
      imageUrl: 'https://example.com/images/denim-jacket.jpg',
      condition: 'Good',
      status: 'Archived',
      purchasePrice: 65.0,
      tags: ['casual'],
      analytics: { wearCount: 2 },
    },
  ]);
  console.log('Clothing items:', clothingDocs.length);

  // Outfits
  const [outfit1, outfit2] = await Outfit.insertMany([
    {
      userId: user1._id,
      name: 'Casual Friday',
      clothingItems: [clothingDocs[0]._id, clothingDocs[1]._id, clothingDocs[4]._id],
      occasion: 'casual',
      season: 'all',
      rating: 4,
    },
    {
      userId: user1._id,
      name: 'Work Chic',
      clothingItems: [clothingDocs[7]._id, clothingDocs[3]._id, clothingDocs[8]._id],
      occasion: 'work',
      season: 'fall',
      rating: 5,
    },
  ]);
  console.log('Outfits:', outfit1._id, outfit2._id);

  // Wear logs
  const midnight = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const [log1, log2, log3] = await WearLog.insertMany([
    {
      userId: user1._id,
      logDate: midnight(1),
      clothingWorn: [
        { itemId: clothingDocs[0]._id, outfitId: outfit1._id },
        { itemId: clothingDocs[1]._id, outfitId: outfit1._id },
        { itemId: clothingDocs[4]._id, outfitId: outfit1._id },
      ],
      occasion: 'casual',
    },
    {
      userId: user1._id,
      logDate: midnight(3),
      clothingWorn: [
        { itemId: clothingDocs[7]._id, outfitId: outfit2._id },
        { itemId: clothingDocs[3]._id, outfitId: outfit2._id },
      ],
      occasion: 'work',
    },
    {
      userId: user1._id,
      logDate: midnight(7),
      clothingWorn: [{ itemId: clothingDocs[2]._id }],
      occasion: 'date night',
    },
  ]);
  console.log('Wear logs:', log1._id, log2._id, log3._id);

  // Partner
  const [partner1] = await Partner.insertMany([
    {
      name: 'ThredUp',
      type: 'Resale',
      website: 'https://www.thredup.com',
      email: 'partners@thredup.com',
      description: 'Online consignment and thrift store',
      apiEndpoint: 'https://api.thredup.com/v1/listings',
      isActive: true,
    },
  ]);
  console.log('Partner:', partner1._id);

  // Thoughtful purchase + similarity checks
  const [purchase1] = await ThoughtfulPurchase.insertMany([
    {
      userId: user1._id,
      itemName: 'Camel Wool Coat',
      description: 'Long camel coat for winter',
      imageUrl: 'https://example.com/images/camel-coat.jpg',
      estimatedPrice: 250.0,
      sourceUrl: 'https://www.zara.com/camel-coat',
      cooldownEndsAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h from now
      status: 'pending',
    },
  ]);
  console.log('ThoughtfulPurchase:', purchase1._id);

  await SimilarityCheck.insertMany([
    { purchaseId: purchase1._id, clothingId: clothingDocs[3]._id, score: 0.82, alertSent: true },
    { purchaseId: purchase1._id, clothingId: clothingDocs[6]._id, score: 0.45, alertSent: false },
  ]);
  console.log('SimilarityChecks: 2');

  // Export
  await Export.insertMany([
    {
      userId: user1._id,
      clothingId: clothingDocs[9]._id,
      partnerId: partner1._id,
      type: 'resale',
      price: 20.0,
      description: 'Gently used denim jacket',
      status: 'active',
      checklistCompleted: true,
      consent: true,
      selectedFields: ['name', 'brand', 'condition', 'imageUrl'],
    },
  ]);
  console.log('Exports: 1');

  // Notifications
  await Notification.insertMany([
    {
      userId: user1._id,
      type: 'forgotten_item',
      message: "You haven't worn your Silk Scarf in over 30 days.",
      isRead: false,
      relatedId: clothingDocs[5]._id,
    },
    {
      userId: user1._id,
      type: 'similarity_alert',
      message:
        'The Camel Wool Coat you want to buy is 82% similar to your Navy Blazer. Do you really need it?',
      isRead: false,
      relatedId: purchase1._id,
    },
  ]);
  console.log('Notifications: 2');

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
