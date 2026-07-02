const request = require('supertest');
const app = require('../../src/app');
const Clothing = require('../../src/models/Clothing');
const WearLog = require('../../src/models/WearLog');
const { ANNUAL_RECAP_MIN_LOGS } = require('../../src/config/constants');

const item = (userId, overrides = {}) => ({
  userId,
  name: 'Blue Tee',
  brand: 'Uniqlo',
  category: 'tops',
  colors: ['blue'],
  size: 'M',
  imageUrl: 'https://example.com/tee.png',
  condition: 'Good',
  ...overrides,
});

// One log per distinct day — BR8's unique {userId, logDate} index forbids duplicates.
const midnightUTCDaysAgo = (n) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

describe('Analytics API (/api/analytics/annual-recap)', () => {
  let token;
  let userId;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1!',
    });
    token = res.body.token;
    userId = res.body._id;
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/analytics/annual-recap');
    expect(res.statusCode).toBe(401);
  });

  test('returns 422 with RECAP_NOT_ENOUGH_LOGS below the minimum (BR25)', async () => {
    const clothing = await Clothing.create(item(userId));
    await WearLog.create({
      userId,
      logDate: midnightUTCDaysAgo(1),
      clothingWorn: [{ itemId: clothing._id }],
    });

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('RECAP_NOT_ENOUGH_LOGS');
  });

  test('returns the recap at the minimum and excludes non-Available items (BR25/BR23)', async () => {
    const kept = await Clothing.create(item(userId, { analytics: { wearCount: 3 } }));
    await Clothing.create(item(userId, { name: 'Archived Coat', status: 'Archived' }));
    await Clothing.create(item(userId, { name: 'Sold Shirt', status: 'Exported' }));

    await WearLog.create(
      Array.from({ length: ANNUAL_RECAP_MIN_LOGS }, (_, i) => ({
        userId,
        logDate: midnightUTCDaysAgo(i),
        clothingWorn: [{ itemId: kept._id }],
      }))
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    // BR23: the archived and exported items must not count
    expect(res.body.totalClothingItems).toBe(1);
    expect(res.body.mostWornItem.name).toBe('Blue Tee');
  });
});
