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

  await Promise.all([
    User.deleteMany({}), Clothing.deleteMany({}), Outfit.deleteMany({}),
    WearLog.deleteMany({}), ThoughtfulPurchase.deleteMany({}), SimilarityCheck.deleteMany({}),
    Partner.deleteMany({}), Export.deleteMany({}), Notification.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const midnight = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const hash = await bcrypt.hash('password123', 10);

  // ─────────────────────────────────────────────────────────────────────────────
  // USERS (10)
  // ─────────────────────────────────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Admin User',    email: 'admin@redrobe.com', password: hash, role: 'admin' },
    {
      name: 'Jane Doe', email: 'jane@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true, notificationSlots: ['09:00', '18:00'],
      preferences: { favoriteColors: ['black', 'white', 'navy'], favoriteCategories: ['tops', 'dresses'], forgottenItemThresholdDays: 45 },
    },
    {
      name: 'Alex Kim', email: 'alex@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true, notificationSlots: ['08:00'],
      preferences: { favoriteColors: ['grey', 'olive'], favoriteCategories: ['outerwear', 'shoes'], forgottenItemThresholdDays: 30 },
    },
    {
      name: 'Sam Park', email: 'sam@redrobe.com', password: hash, role: 'user',
      notificationEnabled: false,
      scheduledDeletionAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // BR3: purges in 20 days
    },
    {
      name: 'Maya Chen', email: 'maya@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true, notificationSlots: ['10:00'],
      preferences: { favoriteColors: ['red', 'yellow'], favoriteCategories: ['dresses', 'accessories'], forgottenItemThresholdDays: 21 },
    },
    {
      name: 'Leo Park', email: 'leo@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true, notificationSlots: ['07:30'],
      preferences: { favoriteColors: ['black', 'grey'], favoriteCategories: ['tops', 'shoes'], forgottenItemThresholdDays: 60 },
    },
    {
      name: 'Zoe Laurent', email: 'zoe@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true, notificationSlots: ['09:00', '20:00'],
      preferences: { favoriteColors: ['brown', 'cream', 'rust'], favoriteCategories: ['tops', 'accessories'], forgottenItemThresholdDays: 30 },
    },
    {
      name: 'Kai Torres', email: 'kai@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true, notificationSlots: ['06:00'],
      preferences: { favoriteColors: ['black', 'white'], favoriteCategories: ['shoes', 'outerwear'], forgottenItemThresholdDays: 30 },
    },
    {
      name: 'Emma Wilson', email: 'emma@redrobe.com', password: hash, role: 'user',
      notificationEnabled: false, // master off — BR28: no notifications sent
      preferences: { favoriteColors: ['cream', 'navy'], favoriteCategories: ['outerwear', 'shoes'], forgottenItemThresholdDays: 30 },
    },
    {
      name: 'Ryan Nguyen', email: 'ryan@redrobe.com', password: hash, role: 'user',
      notificationEnabled: true,
      preferences: { forgottenItemThresholdDays: 30 }, // new account, minimal prefs
    },
  ]);
  const [, janeId, alexId, samId, mayaId, leoId, zoeId, kaiId, emmaId, ryanId] = users.map((u) => u._id);
  console.log('Users: 10');

  // ─────────────────────────────────────────────────────────────────────────────
  // PARTNERS (10)
  // ─────────────────────────────────────────────────────────────────────────────
  const partners = await Partner.insertMany([
    { name: 'ThredUp',          type: 'resale',    website: 'https://www.thredup.com',        email: 'partners@thredup.com',        description: 'Online consignment and thrift store',   apiEndpoint: 'https://api.thredup.com/v1/listings',     isActive: true  },
    { name: 'Goodwill',         type: 'donation',  website: 'https://www.goodwill.org',        email: 'partners@goodwill.org',        description: 'Donate to those in need',                                                                        isActive: true  },
    { name: 'The RealReal',     type: 'resale',    website: 'https://www.therealreal.com',     email: 'consign@therealreal.com',      description: 'Luxury consignment marketplace',         apiEndpoint: 'https://api.therealreal.com/listings',    isActive: true  },
    { name: 'Tailor & Co',      type: 'tailor',    website: 'https://www.tailorco.com',                                               description: 'Upcycle and alter your clothes',                                                                 isActive: false }, // BR30: hidden
    { name: 'Poshmark',         type: 'resale',    website: 'https://poshmark.com',            email: 'support@poshmark.com',         description: 'Social marketplace for fashion',         apiEndpoint: 'https://api.poshmark.com/v2/listings',    isActive: true  },
    { name: 'Depop',            type: 'resale',    website: 'https://www.depop.com',           email: 'sellers@depop.com',            description: 'Trend-driven secondhand marketplace',    apiEndpoint: 'https://api.depop.com/v1/listings',       isActive: true  },
    { name: 'Buffalo Exchange', type: 'resale',    website: 'https://buffaloexchange.com',     email: 'trade@buffaloexchange.com',    description: 'Buy, sell, and trade clothing',                                                                  isActive: true  },
    { name: 'Salvation Army',   type: 'donation',  website: 'https://www.salvationarmyusa.org',email: 'donate@salvationarmy.org',     description: 'Clothing donations for communities in need',                                                     isActive: true  },
    { name: 'Remake',           type: 'upcycle',   website: 'https://remake.world',            email: 'hello@remake.world',           description: 'Ethical fashion upcycling service',                                                              isActive: true  },
    { name: 'Stitch Fix',       type: 'tailor',    website: 'https://www.stitchfix.com',       email: 'partners@stitchfix.com',       description: 'Personal styling and alterations',                                                               isActive: true  },
  ]);
  const [thredUpId, goodwillId, realRealId, , poshmarkId, depopId, , salvationArmyId, remakeId] = partners.map((p) => p._id);
  console.log('Partners: 10');

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Jane (16 items)   indices: jC[0]…jC[15]
  // ─────────────────────────────────────────────────────────────────────────────
  const janeClothing = await Clothing.insertMany([
    /* [0]  */ { userId: janeId, name: 'White Cotton Tee',       brand: 'Uniqlo',         category: 'tops',        colors: ['white'],            size: 'M',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', purchasePrice: 19.9,  purchaseDate: new Date('2024-03-01'), tags: ['casual','basics'],        analytics: { wearCount: 12 } },
    /* [1]  */ { userId: janeId, name: 'Black Slim Jeans',       brand: "Levi's",         category: 'bottoms',     colors: ['black'],            size: '28',       condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246', purchasePrice: 79.0,  purchaseDate: new Date('2023-11-15'), tags: ['casual','versatile'],     analytics: { wearCount: 20, lastWornAt: midnight(6) } },
    /* [2]  */ { userId: janeId, name: 'Floral Midi Dress',      brand: 'Zara',           category: 'dresses',     colors: ['pink','white'],     size: 'S',        condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1', purchasePrice: 59.9,  purchaseDate: new Date('2024-04-20'), tags: ['summer','date'],          analytics: { wearCount: 3 } },
    /* [3]  */ { userId: janeId, name: 'Navy Blazer',            brand: 'J.Crew',         category: 'outerwear',   colors: ['navy'],             size: 'M',        condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea', purchasePrice: 120.0, purchaseDate: new Date('2023-09-01'), tags: ['work','formal'],          analytics: { wearCount: 8 } },
    /* [4]  */ { userId: janeId, name: 'White Sneakers',         brand: 'Nike',           category: 'shoes',       colors: ['white'],            size: '7',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', purchasePrice: 90.0,                                       tags: ['casual','everyday'],     analytics: { wearCount: 30, lastWornAt: midnight(2) } },
    /* [5]  */ { userId: janeId, name: 'Silk Scarf',             brand: 'H&M',            category: 'accessories', colors: ['multicolor'],       size: 'One Size', condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1601924921557-45e6ecd0a003', purchasePrice: 25.0,                                       tags: ['accessories'],           analytics: { wearCount: 1,  lastWornAt: midnight(60), lastNotifiedAt: new Date() } },
    /* [6]  */ { userId: janeId, name: 'Grey Hoodie',            brand: 'Champion',       category: 'tops',        colors: ['grey'],             size: 'L',        condition: 'Fair',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7', purchasePrice: 45.0,                                       tags: ['casual','winter'],       analytics: { wearCount: 15 } },
    /* [7]  */ { userId: janeId, name: 'Pleated Skirt',          brand: 'Mango',          category: 'bottoms',     colors: ['beige'],            size: 'S',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee', purchasePrice: 39.9,                                       tags: ['work','smart casual'],   analytics: { wearCount: 5 } },
    /* [8]  */ { userId: janeId, name: 'Leather Ankle Boots',    brand: 'Steve Madden',   category: 'shoes',       colors: ['brown'],            size: '7',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2', purchasePrice: 110.0,                                      tags: ['fall','winter'],         analytics: { wearCount: 9 } },
    /* [9]  */ { userId: janeId, name: 'Denim Jacket',           brand: 'Gap',            category: 'outerwear',   colors: ['blue'],             size: 'M',        condition: 'Good',      status: 'Archived',  imageUrl: 'https://images.unsplash.com/photo-1576995883346-6cee8e39ad3f', purchasePrice: 65.0,                                       tags: ['casual'],                analytics: { wearCount: 2 } },
    /* [10] */ { userId: janeId, name: 'Striped Linen Shirt',    brand: 'Cos',            category: 'tops',        colors: ['blue','white'],     size: 'M',        condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8', purchasePrice: 55.0,  purchaseDate: new Date('2024-06-01'), tags: ['summer','casual'],        analytics: { wearCount: 6 } },
    /* [11] */ { userId: janeId, name: 'Olive Cargo Pants',      brand: 'Uniqlo',         category: 'bottoms',     colors: ['olive'],            size: 'M',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', purchasePrice: 49.9,                                       tags: ['casual','outdoor'],      analytics: { wearCount: 4 } },
    /* [12] */ { userId: janeId, name: 'Black Turtleneck',       brand: 'Everlane',       category: 'tops',        colors: ['black'],            size: 'S',        condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1614676471928-2ed0ad1061a4', purchasePrice: 68.0,                                       tags: ['winter','work'],         analytics: { wearCount: 11 } },
    /* [13] */ { userId: janeId, name: 'Gold Hoop Earrings',     brand: 'Mejuri',         category: 'accessories', colors: ['gold'],             size: 'One Size', condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236', purchasePrice: 78.0,                                       tags: ['everyday','minimal'],    analytics: { wearCount: 22, lastWornAt: midnight(1) } },
    /* [14] */ { userId: janeId, name: 'Wool Camel Coat',        brand: 'Massimo Dutti',  category: 'outerwear',   colors: ['camel'],            size: 'M',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1539109132314-34a77ae7092b', purchasePrice: 199.0, purchaseDate: new Date('2024-01-10'), tags: ['winter','formal'],        analytics: { wearCount: 3 } },
    /* [15] */ { userId: janeId, name: 'Ripped Denim Shorts',    brand: 'Zara',           category: 'bottoms',     colors: ['blue'],             size: 'S',        condition: 'Damaged',   status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b', purchasePrice: 35.0,                                       tags: ['summer'],                analytics: { wearCount: 1 } },
  ]);
  const jC = janeClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Alex (6 items)   indices: aC[0]…aC[5]
  // ─────────────────────────────────────────────────────────────────────────────
  const alexClothing = await Clothing.insertMany([
    /* [0] */ { userId: alexId, name: 'Olive Field Jacket', brand: 'Carhartt',        category: 'outerwear', colors: ['olive'],          size: 'M',  condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1617113930975-f9c7243ae527', purchasePrice: 130.0, tags: ['outdoor','casual'],       analytics: { wearCount: 7 } },
    /* [1] */ { userId: alexId, name: 'Grey Chinos',        brand: 'Banana Republic', category: 'bottoms',   colors: ['grey'],           size: '32', condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa804b86d47b', purchasePrice: 79.0,  tags: ['work','smart casual'],    analytics: { wearCount: 14, lastWornAt: midnight(3) } },
    /* [2] */ { userId: alexId, name: 'Running Shoes',      brand: 'Adidas',          category: 'shoes',     colors: ['black','white'],  size: '10', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1587563877366-26d526223d22', purchasePrice: 110.0, tags: ['sport','everyday'],       analytics: { wearCount: 25, lastWornAt: midnight(1) } },
    /* [3] */ { userId: alexId, name: 'Merino Crew Neck',   brand: 'Muji',            category: 'tops',      colors: ['charcoal'],       size: 'M',  condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4', purchasePrice: 60.0,  tags: ['work','minimal'],         analytics: { wearCount: 18 } },
    /* [4] */ { userId: alexId, name: 'Chelsea Boots',      brand: 'Clarks',          category: 'shoes',     colors: ['tan'],            size: '10', condition: 'Fair',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76', purchasePrice: 145.0, tags: ['smart casual','fall'],    analytics: { wearCount: 6 } },
    /* [5] */ { userId: alexId, name: 'Puffer Vest',        brand: 'Patagonia',       category: 'outerwear', colors: ['black'],          size: 'M',  condition: 'Good',      status: 'Archived',  imageUrl: 'https://images.unsplash.com/photo-1604644401890-0bd678c83788', purchasePrice: 119.0, tags: ['outdoor','winter'],       analytics: { wearCount: 3 } },
  ]);
  const aC = alexClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Sam (3 items, never worn — account pending deletion)
  // ─────────────────────────────────────────────────────────────────────────────
  await Clothing.insertMany([
    { userId: samId, name: 'Vintage Band Tee', brand: 'Thrift',    category: 'tops',        colors: ['grey'],  size: 'M',        condition: 'Fair', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', purchasePrice: 5.0,  tags: ['casual'],    analytics: { wearCount: 0 } },
    { userId: samId, name: 'Slim Trousers',    brand: 'Zara',      category: 'bottoms',     colors: ['black'], size: '30',       condition: 'Good', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1', purchasePrice: 49.9, tags: ['work'],      analytics: { wearCount: 0 } },
    { userId: samId, name: 'Canvas Backpack',  brand: 'Herschel',  category: 'accessories', colors: ['navy'],  size: 'One Size', condition: 'Good', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1544816153-09730bc47d3d', purchasePrice: 55.0, tags: ['everyday'],  analytics: { wearCount: 0 } },
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Maya (4 items)   mC[0]…mC[3]
  // ─────────────────────────────────────────────────────────────────────────────
  const mayaClothing = await Clothing.insertMany([
    /* [0] */ { userId: mayaId, name: 'Red Wrap Dress',       brand: 'ASOS',           category: 'dresses',     colors: ['red'],           size: 'S',        condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8', purchasePrice: 55.0, tags: ['date','event'],         analytics: { wearCount: 8 } },
    /* [1] */ { userId: mayaId, name: 'Pearl Necklace',       brand: 'Mejuri',         category: 'accessories', colors: ['white'],         size: 'One Size', condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d', purchasePrice: 95.0, tags: ['elegant','everyday'],   analytics: { wearCount: 15 } },
    /* [2] */ { userId: mayaId, name: 'Beige Trench Coat',    brand: 'Burberry',       category: 'outerwear',   colors: ['beige'],         size: 'S',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a', purchasePrice: 320.0,tags: ['classic','formal'],     analytics: { wearCount: 4 } },
    /* [3] */ { userId: mayaId, name: 'Yellow Summer Dress',  brand: 'Zara',           category: 'dresses',     colors: ['yellow'],        size: 'S',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446', purchasePrice: 49.9, tags: ['summer','casual'],      analytics: { wearCount: 2 } },
  ]);
  const mC = mayaClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Leo (3 items)   lC[0]…lC[2]
  // ─────────────────────────────────────────────────────────────────────────────
  const leoClothing = await Clothing.insertMany([
    /* [0] */ { userId: leoId, name: 'Black Dress Shirt',    brand: 'Theory',          category: 'tops',    colors: ['black'],  size: 'M',  condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157', purchasePrice: 155.0, tags: ['work','formal'],       analytics: { wearCount: 6 } },
    /* [1] */ { userId: leoId, name: 'Grey Wool Trousers',   brand: 'Hugo Boss',       category: 'bottoms', colors: ['grey'],   size: '32', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa804b86d47b', purchasePrice: 185.0, tags: ['work','smart casual'], analytics: { wearCount: 4, lastWornAt: midnight(65) } },
    /* [2] */ { userId: leoId, name: 'Oxford Shoes',         brand: 'Allen Edmonds',   category: 'shoes',   colors: ['brown'],  size: '10', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', purchasePrice: 295.0, tags: ['formal','work'],       analytics: { wearCount: 10 } },
  ]);
  const lC = leoClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Zoe (4 items)   zC[0]…zC[3]
  // ─────────────────────────────────────────────────────────────────────────────
  const zoeClothing = await Clothing.insertMany([
    /* [0] */ { userId: zoeId, name: 'Rust Linen Blouse',      brand: 'Free People', category: 'tops',        colors: ['rust'],   size: 'M',        condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8', purchasePrice: 78.0,  tags: ['boho','summer'],      analytics: { wearCount: 7 } },
    /* [1] */ { userId: zoeId, name: 'Cream Wide-Leg Pants',   brand: 'Mango',       category: 'bottoms',     colors: ['cream'],  size: 'S',        condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', purchasePrice: 55.0,  tags: ['boho','casual'],      analytics: { wearCount: 5 } },
    /* [2] */ { userId: zoeId, name: 'Brown Leather Bag',      brand: 'Coach',       category: 'accessories', colors: ['brown'],  size: 'One Size', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa', purchasePrice: 240.0, tags: ['everyday','classic'], analytics: { wearCount: 20, lastWornAt: midnight(2) } },
    /* [3] */ { userId: zoeId, name: 'Vintage Denim Vest',     brand: 'Thrift',      category: 'outerwear',   colors: ['blue'],   size: 'M',        condition: 'Fair',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1576995883346-6cee8e39ad3f', purchasePrice: 12.0,  tags: ['vintage','casual'],   analytics: { wearCount: 1,  lastWornAt: midnight(35) } },
  ]);
  const zC = zoeClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Kai (3 items)   kC[0]…kC[2]
  // ─────────────────────────────────────────────────────────────────────────────
  const kaiClothing = await Clothing.insertMany([
    /* [0] */ { userId: kaiId, name: 'Black Track Pants',      brand: 'Nike',      category: 'bottoms', colors: ['black'],          size: 'M', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1519058082700-08a515d1a41a', purchasePrice: 65.0,  tags: ['sport','everyday'], analytics: { wearCount: 22, lastWornAt: midnight(1) } },
    /* [1] */ { userId: kaiId, name: 'White Sports Bra',       brand: 'Lululemon', category: 'tops',    colors: ['white'],          size: 'S', condition: 'Fair',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a', purchasePrice: 58.0,  tags: ['sport','gym'],      analytics: { wearCount: 18 } },
    /* [2] */ { userId: kaiId, name: 'Trail Running Shoes',    brand: 'Hoka',      category: 'shoes',   colors: ['grey','orange'],  size: '8', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', purchasePrice: 145.0, tags: ['sport','trail'],    analytics: { wearCount: 35, lastWornAt: midnight(1) } },
  ]);
  const kC = kaiClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Emma (3 items)   eC[0]…eC[2]
  // ─────────────────────────────────────────────────────────────────────────────
  const emmaClothing = await Clothing.insertMany([
    /* [0] */ { userId: emmaId, name: 'Cashmere Cardigan',   brand: 'J.Crew',            category: 'tops',      colors: ['cream'], size: 'M', condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105', purchasePrice: 198.0, tags: ['cozy','work'],        analytics: { wearCount: 5 } },
    /* [1] */ { userId: emmaId, name: 'Tailored Blazer',     brand: '& Other Stories',   category: 'outerwear', colors: ['black'], size: 'M', condition: 'Excellent', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea', purchasePrice: 175.0, tags: ['work','formal'],      analytics: { wearCount: 3 } },
    /* [2] */ { userId: emmaId, name: 'Ankle Strap Heels',   brand: 'Stuart Weitzman',   category: 'shoes',     colors: ['nude'],  size: '7', condition: 'Good',      status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2', purchasePrice: 350.0, tags: ['formal','event'],     analytics: { wearCount: 2 } },
  ]);
  const eC = emmaClothing.map((i) => i._id);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLOTHING — Ryan (2 items — new account)
  // ─────────────────────────────────────────────────────────────────────────────
  await Clothing.insertMany([
    { userId: ryanId, name: 'Basic White T-Shirt', brand: 'Fruit of the Loom', category: 'tops',    colors: ['white'],  size: 'L',  condition: 'Good', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', purchasePrice: 8.0,  tags: ['casual','basics'], analytics: { wearCount: 0 } },
    { userId: ryanId, name: 'Slim Fit Jeans',      brand: 'Wrangler',          category: 'bottoms', colors: ['indigo'], size: '32', condition: 'Good', status: 'Available', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246', purchasePrice: 42.0, tags: ['casual'],          analytics: { wearCount: 0 } },
  ]);

  console.log('Clothing: 44 total');

  // ─────────────────────────────────────────────────────────────────────────────
  // OUTFITS (10)
  // ─────────────────────────────────────────────────────────────────────────────
  await Outfit.insertMany([
    { userId: janeId,  name: 'Casual Friday',    clothingItems: [jC[0], jC[1],  jC[4]],         occasion: 'casual',   season: 'all',    rating: 4 },
    { userId: janeId,  name: 'Work Chic',        clothingItems: [jC[7], jC[3],  jC[8]],         occasion: 'work',     season: 'fall',   rating: 5 },
    { userId: janeId,  name: 'Summer Brunch',    clothingItems: [jC[2], jC[13]],                occasion: 'brunch',   season: 'summer', rating: 5 },
    { userId: janeId,  name: 'Winter Layers',    clothingItems: [jC[12], jC[14], jC[8]],        occasion: 'work',     season: 'winter', rating: 4 },
    { userId: alexId,  name: 'Smart Casual',     clothingItems: [aC[1], aC[3],  aC[4]],         occasion: 'work',     season: 'all',    rating: 4 },
    { userId: alexId,  name: 'Weekend Hike',     clothingItems: [aC[0], aC[1],  aC[2]],         occasion: 'outdoor',  season: 'fall',   rating: 5 },
    { userId: mayaId,  name: 'Office Glam',      clothingItems: [mC[2], mC[0],  mC[1]],         occasion: 'work',     season: 'all',    rating: 5 },
    { userId: leoId,   name: 'Business Formal',  clothingItems: [lC[0], lC[1],  lC[2]],         occasion: 'work',     season: 'all',    rating: 4 },
    { userId: zoeId,   name: 'Earthy Tones',     clothingItems: [zC[0], zC[1],  zC[2]],         occasion: 'casual',   season: 'spring', rating: 5 },
    { userId: kaiId,   name: 'Gym Ready',        clothingItems: [kC[0], kC[1],  kC[2]],         occasion: 'gym',      season: 'all',    rating: 5 },
  ]);
  console.log('Outfits: 10');

  // ─────────────────────────────────────────────────────────────────────────────
  // WEAR LOGS  (randomised per user, unique day per user enforced by Set)
  // ─────────────────────────────────────────────────────────────────────────────
  const buildLogs = (userId, availableItems, count, dayRange) => {
    const usedDays = new Set();
    const logs = [];
    while (usedDays.size < count) {
      const daysAgo = Math.floor(Math.random() * dayRange) + 1;
      if (!usedDays.has(daysAgo)) {
        usedDays.add(daysAgo);
        const numItems = 2 + Math.floor(Math.random() * 3);
        const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
        const worn = shuffled.slice(0, Math.min(numItems, shuffled.length)).map((itemId) => ({ itemId }));
        logs.push({ userId, logDate: midnight(daysAgo), clothingWorn: worn, occasion: 'casual' });
      }
    }
    return logs;
  };

  const janeAvail = janeClothing.filter((i) => i.status === 'Available').map((i) => i._id);
  const alexAvail = alexClothing.filter((i) => i.status === 'Available').map((i) => i._id);
  const mayaAvail = mayaClothing.filter((i) => i.status === 'Available').map((i) => i._id);
  const zoeAvail  = zoeClothing.filter((i) => i.status === 'Available').map((i) => i._id);
  const kaiAvail  = kaiClothing.filter((i) => i.status === 'Available').map((i) => i._id);

  await WearLog.insertMany([
    ...buildLogs(janeId, janeAvail, 35, 65),
    ...buildLogs(alexId, alexAvail, 10, 20),
    ...buildLogs(mayaId, mayaAvail,  5, 30),
    ...buildLogs(zoeId,  zoeAvail,   4, 25),
    ...buildLogs(kaiId,  kaiAvail,   8, 15),
  ]);
  console.log('Wear logs: ~62 total (Jane 35, Alex 10, Maya 5, Zoe 4, Kai 8)');

  // ─────────────────────────────────────────────────────────────────────────────
  // THOUGHTFUL PURCHASES (11)
  // ─────────────────────────────────────────────────────────────────────────────
  const janePurchases = await ThoughtfulPurchase.insertMany([
    { userId: janeId, itemName: 'Camel Wool Coat',    description: 'Long camel coat for winter.',        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea', estimatedPrice: 250, sourceUrl: 'https://zara.com/camel-coat', cooldownEndsAt: new Date(Date.now() + 48*60*60*1000), status: 'pending'  },
    { userId: janeId, itemName: 'Red Mini Dress',     description: 'Bright red cocktail dress.',          imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8', estimatedPrice: 89,                                   cooldownEndsAt: new Date(Date.now() - 3*24*60*60*1000), status: 'approved' },
    { userId: janeId, itemName: 'Platform Sneakers',  description: 'White platform trend sneakers.',      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', estimatedPrice: 120,                                  cooldownEndsAt: new Date(Date.now() - 5*24*60*60*1000), status: 'rejected' },
  ]);
  const [jp0, jp1] = janePurchases.map((p) => p._id); // jp0=camel coat, jp1=red dress

  const [ap0] = (await ThoughtfulPurchase.insertMany([
    { userId: alexId, itemName: 'Leather Weekender Bag', description: 'Full-grain leather bag for travel.', imageUrl: 'https://images.unsplash.com/photo-1547949003-9792a18a2601', estimatedPrice: 180, cooldownEndsAt: new Date(Date.now() + 24*60*60*1000), status: 'pending' },
  ])).map((p) => p._id);

  const mayaPurchases = await ThoughtfulPurchase.insertMany([
    { userId: mayaId, itemName: 'Leopard Print Blouse', description: 'Statement blouse for evenings.',   imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446', estimatedPrice: 72,  cooldownEndsAt: new Date(Date.now() + 24*60*60*1000), status: 'pending'  },
    { userId: mayaId, itemName: 'Satin Midi Skirt',     description: 'Champagne satin skirt, elegant.',  imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee', estimatedPrice: 95,  cooldownEndsAt: new Date(Date.now() - 2*24*60*60*1000), status: 'approved' },
  ]);
  const [mp0, mp1] = mayaPurchases.map((p) => p._id);

  const [lp0] = (await ThoughtfulPurchase.insertMany([
    { userId: leoId, itemName: 'Cashmere V-Neck Sweater', description: 'Navy cashmere sweater.', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105', estimatedPrice: 210, cooldownEndsAt: new Date(Date.now() + 36*60*60*1000), status: 'pending' },
  ])).map((p) => p._id);

  const [zp0] = (await ThoughtfulPurchase.insertMany([
    { userId: zoeId, itemName: 'Cognac Leather Belt', description: 'Wide leather belt, earthy tones.', imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa', estimatedPrice: 65, cooldownEndsAt: new Date(Date.now() - 4*24*60*60*1000), status: 'rejected' },
  ])).map((p) => p._id);

  const kaiPurchases = await ThoughtfulPurchase.insertMany([
    { userId: kaiId, itemName: 'Yoga Mat Bag',         description: 'Carrying bag for yoga mat.',        imageUrl: 'https://images.unsplash.com/photo-1544816153-09730bc47d3d', estimatedPrice: 45,  cooldownEndsAt: new Date(Date.now() + 30*60*60*1000), status: 'pending'  },
    { userId: kaiId, itemName: 'Compression Leggings', description: 'High-waist compression leggings.',  imageUrl: 'https://images.unsplash.com/photo-1519058082700-08a515d1a41a', estimatedPrice: 88,  cooldownEndsAt: new Date(Date.now() - 1*24*60*60*1000), status: 'approved' },
  ]);
  const [kp0, kp1] = kaiPurchases.map((p) => p._id);

  await ThoughtfulPurchase.insertMany([
    { userId: emmaId, itemName: 'Silk Blouse', description: 'Ivory silk blouse.', imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c7176c8', estimatedPrice: 130, cooldownEndsAt: new Date(Date.now() - 3*24*60*60*1000), status: 'rejected' },
  ]);

  console.log('Thoughtful purchases: 11');

  // ─────────────────────────────────────────────────────────────────────────────
  // SIMILARITY CHECKS (10)
  // purchaseId → clothingId (must belong to same user — BR19 excludes Archived)
  // ─────────────────────────────────────────────────────────────────────────────
  await SimilarityCheck.insertMany([
    // Jane's Camel Wool Coat purchase vs her wardrobe
    { purchaseId: jp0, clothingId: jC[14], score: 0.91, alertSent: true  }, // vs Wool Camel Coat  ≥0.70 → alert ✓
    { purchaseId: jp0, clothingId: jC[3],  score: 0.82, alertSent: true  }, // vs Navy Blazer      ≥0.70 → alert ✓
    { purchaseId: jp0, clothingId: jC[6],  score: 0.45, alertSent: false }, // vs Grey Hoodie      <0.70 → no alert ✓
    // Maya's Leopard Blouse vs her wardrobe
    { purchaseId: mp0, clothingId: mC[0],  score: 0.73, alertSent: true  }, // vs Red Wrap Dress   ≥0.70 → alert ✓
    { purchaseId: mp0, clothingId: mC[3],  score: 0.55, alertSent: false }, // vs Yellow Dress     <0.70 → no alert ✓
    // Leo's Cashmere VNeck vs his wardrobe
    { purchaseId: lp0, clothingId: lC[0],  score: 0.68, alertSent: false }, // vs Black Dress Shirt <0.70 → no alert ✓
    { purchaseId: lp0, clothingId: lC[1],  score: 0.22, alertSent: false }, // vs Grey Trousers    <0.70 → no alert ✓
    // Zoe's Cognac Belt vs her wardrobe
    { purchaseId: zp0, clothingId: zC[2],  score: 0.76, alertSent: true  }, // vs Brown Bag        ≥0.70 → alert ✓
    // Kai's Yoga Mat Bag + Compression Leggings
    { purchaseId: kp0, clothingId: kC[0],  score: 0.31, alertSent: false }, // vs Black Track Pants <0.70 → no alert ✓
    { purchaseId: kp1, clothingId: kC[0],  score: 0.78, alertSent: true  }, // vs Black Track Pants ≥0.70 → alert ✓
  ]);
  console.log('Similarity checks: 10');

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORTS (10)
  // BR21: Damaged condition → type must NOT be 'resale'
  // BR17/BR20: checklistCompleted + consent must be true before export
  // ─────────────────────────────────────────────────────────────────────────────
  await Export.insertMany([
    // Jane
    { userId: janeId,  clothingId: jC[9],  partnerId: thredUpId,     type: 'resale',   price: 20,    description: 'Gently used denim jacket.',      status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','brand','condition','imageUrl'] },
    { userId: janeId,  clothingId: jC[11], partnerId: goodwillId,    type: 'donation',                                                              status: 'donated', checklistCompleted: true, consent: true, selectedFields: ['name','colors','condition'] },
    { userId: janeId,  clothingId: jC[15], partnerId: goodwillId,    type: 'donation',               description: 'Worn denim shorts.',             status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','condition'] },          // Damaged → donation only (BR21)
    // Alex
    { userId: alexId,  clothingId: aC[5],  partnerId: salvationArmyId, type: 'donation',                                                            status: 'donated', checklistCompleted: true, consent: true, selectedFields: ['name','brand','condition'] },
    // Maya
    { userId: mayaId,  clothingId: mC[2],  partnerId: realRealId,    type: 'resale',   price: 120,   description: 'Burberry trench, great condition.', status: 'active', checklistCompleted: true, consent: true, selectedFields: ['name','brand','size','condition','imageUrl'] },
    { userId: mayaId,  clothingId: mC[3],  partnerId: depopId,       type: 'resale',   price: 18,    description: 'Yellow sundress, like new.',       status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','colors','condition','imageUrl'] },
    // Leo
    { userId: leoId,   clothingId: lC[1],  partnerId: salvationArmyId, type: 'donation',                                                            status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','brand','condition'] },
    // Zoe
    { userId: zoeId,   clothingId: zC[3],  partnerId: goodwillId,    type: 'donation',               description: 'Vintage denim vest.',            status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','condition'] },
    // Kai
    { userId: kaiId,   clothingId: kC[1],  partnerId: remakeId,      type: 'upcycle',                description: 'Sports bra for upcycling.',      status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','brand','colors','condition'] }, // Fair → upcycle, not resale
    // Emma
    { userId: emmaId,  clothingId: eC[0],  partnerId: poshmarkId,    type: 'resale',   price: 85,    description: 'Cashmere cardigan, barely worn.', status: 'active',  checklistCompleted: true, consent: true, selectedFields: ['name','brand','size','condition','imageUrl'] },
  ]);
  console.log('Exports: 10');

  // ─────────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS (12 — all 5 types, mix read/unread)
  // BR28: Sam + Emma have notificationEnabled:false → no notifications created for them
  // ─────────────────────────────────────────────────────────────────────────────
  await Notification.insertMany([
    // Jane (5)
    { userId: janeId, type: 'forgotten_item',   message: "You haven't worn your Silk Scarf in over 60 days. Time to rediscover it!",                          isRead: false, relatedId: jC[5]  },
    { userId: janeId, type: 'similarity_alert', message: 'The Camel Wool Coat you want is 91% similar to your Wool Camel Coat. Do you really need it?',        isRead: false, relatedId: jp0    },
    { userId: janeId, type: 'similarity_alert', message: 'The Camel Wool Coat is also 82% similar to your Navy Blazer.',                                       isRead: true,  relatedId: jp0    },
    { userId: janeId, type: 'cooldown_reminder',message: 'Your cooling-off period for Red Mini Dress has ended. Ready to decide?',                             isRead: true,  relatedId: jp1    },
    { userId: janeId, type: 'recap_ready',       message: 'Your 2024 Style Recap is ready! You wore 142 items across 38 outfits.',                              isRead: false                    },
    // Alex (2)
    { userId: alexId, type: 'cooldown_reminder',message: 'Your cooling-off period for Leather Weekender Bag ends in 2 hours.',                                 isRead: false, relatedId: ap0    },
    { userId: alexId, type: 'export_update',     message: 'Your Puffer Vest has been successfully donated.',                                                    isRead: true                     },
    // Maya (2)
    { userId: mayaId, type: 'similarity_alert', message: 'The Leopard Print Blouse is 73% similar to your Red Wrap Dress. Consider wearing what you have!',    isRead: false, relatedId: mp0    },
    { userId: mayaId, type: 'cooldown_reminder',message: 'Your cooling-off period for Satin Midi Skirt has ended. Ready to decide?',                           isRead: true,  relatedId: mp1    },
    // Leo (1)
    { userId: leoId,  type: 'forgotten_item',   message: "You haven't worn your Grey Wool Trousers in over 65 days.",                                           isRead: false, relatedId: lC[1]  },
    // Zoe (1)
    { userId: zoeId,  type: 'forgotten_item',   message: "Your Vintage Denim Vest hasn't been worn in over 35 days. Give it another chance!",                   isRead: false, relatedId: zC[3]  },
    // Kai (1)
    { userId: kaiId,  type: 'cooldown_reminder',message: 'Your cooling-off period for Yoga Mat Bag ends in 6 hours. Still want it?',                           isRead: false, relatedId: kp0    },
  ]);
  console.log('Notifications: 12');

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
