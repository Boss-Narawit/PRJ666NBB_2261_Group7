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

// One log per distinct day — keeps the fixtures readable and unambiguous.
const midnightUTCDaysAgo = (n) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

// A date in June of the previous calendar year — used to prove the year-scoped gate.
const prevYearJune = (day) => new Date(Date.UTC(new Date().getUTCFullYear() - 1, 5, day));

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
    // One short of the gate — robust to whatever ANNUAL_RECAP_MIN_LOGS is set to.
    const belowMin = ANNUAL_RECAP_MIN_LOGS - 1;
    if (belowMin > 0) {
      await WearLog.create(
        Array.from({ length: belowMin }, (_, i) => ({
          userId,
          logDate: midnightUTCDaysAgo(i),
          clothingWorn: [{ itemId: clothing._id }],
        }))
      );
    }

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
    expect(res.body.year).toBe(new Date().getFullYear());
  });

  test('ranks the top 3 most-worn Available items in order', async () => {
    const a = await Clothing.create(item(userId, { name: 'Item A' }));
    const b = await Clothing.create(item(userId, { name: 'Item B' }));
    const c = await Clothing.create(item(userId, { name: 'Item C' }));
    const d = await Clothing.create(item(userId, { name: 'Item D' }));

    // 30 logs. A in all 30, B in 20, C in 10, D in 5 → wear counts 30/20/10/5.
    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => {
        const worn = [{ itemId: a._id }];
        if (i < 20) worn.push({ itemId: b._id });
        if (i < 10) worn.push({ itemId: c._id });
        if (i < 5) worn.push({ itemId: d._id });
        return { userId, logDate: midnightUTCDaysAgo(i), clothingWorn: worn };
      })
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.topItems).toHaveLength(3);
    expect(res.body.topItems.map((t) => t.name)).toEqual(['Item A', 'Item B', 'Item C']);
    expect(res.body.topItems.map((t) => t.rank)).toEqual([1, 2, 3]);
    expect(res.body.topItems.map((t) => t.wearCount)).toEqual([30, 20, 10]);
    expect(res.body.mostWornItem.name).toBe('Item A');
  });

  test('excludes an archived-but-worn item from topItems (BR23), no undefined names', async () => {
    const kept = await Clothing.create(item(userId, { name: 'Kept Tee' }));
    // Worn more than kept, but archived — must not surface (and never with a null name).
    const archived = await Clothing.create(
      item(userId, { name: 'Archived Coat', status: 'Archived' })
    );

    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => ({
        userId,
        logDate: midnightUTCDaysAgo(i),
        clothingWorn: [{ itemId: kept._id }, { itemId: archived._id }],
      }))
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalClothingItems).toBe(1);
    expect(res.body.topItems).toHaveLength(1);
    expect(res.body.topItems[0].name).toBe('Kept Tee');
    expect(res.body.topItems.every((t) => typeof t.name === 'string')).toBe(true);
    expect(res.body.topItems.some((t) => t.id === archived._id.toString())).toBe(false);
  });

  test('totalOutfits counts logs while totalWearCount counts item-wears', async () => {
    const a = await Clothing.create(item(userId, { name: 'Item A' }));
    const b = await Clothing.create(item(userId, { name: 'Item B' }));

    // 30 outfits, each wearing 2 distinct items → 30 outfits, 60 item-wears.
    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => ({
        userId,
        logDate: midnightUTCDaysAgo(i),
        clothingWorn: [{ itemId: a._id }, { itemId: b._id }],
      }))
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalOutfits).toBe(30);
    expect(res.body.totalWearCount).toBe(60);
    expect(res.body.totalWearCount).toBeGreaterThan(res.body.totalOutfits);
  });

  test('computes utilization from unique items worn in the last 90 days (BR24)', async () => {
    const worn1 = await Clothing.create(item(userId, { name: 'Worn 1' }));
    const worn2 = await Clothing.create(item(userId, { name: 'Worn 2' }));
    await Clothing.create(item(userId, { name: 'Never Worn' })); // Available, idle

    // 30 logs across the last 30 days, each wearing worn1 + worn2.
    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => ({
        userId,
        logDate: midnightUTCDaysAgo(i),
        clothingWorn: [{ itemId: worn1._id }, { itemId: worn2._id }],
      }))
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalClothingItems).toBe(3);
    expect(res.body.activeItems).toBe(2); // 2 of 3 worn in the window
    expect(res.body.utilizationRate).toBe(66.7); // (2/3)*100, 1 dp
  });

  test('an archived-but-worn item does not inflate utilization past 100% (BR23/BR24)', async () => {
    const kept = await Clothing.create(item(userId, { name: 'Kept Tee' }));
    const archived = await Clothing.create(
      item(userId, { name: 'Archived Coat', status: 'Archived' })
    );

    // Both worn in the last 90 days, but only kept is Available.
    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => ({
        userId,
        logDate: midnightUTCDaysAgo(i),
        clothingWorn: [{ itemId: kept._id }, { itemId: archived._id }],
      }))
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.totalClothingItems).toBe(1);
    expect(res.body.activeItems).toBe(1); // archived item excluded from the numerator
    expect(res.body.utilizationRate).toBe(100); // 1/1, not 200
    expect(res.body.utilizationRate).toBeLessThanOrEqual(100);
  });

  test('year-scopes the BR25 gate — last-year logs do not count', async () => {
    const clothing = await Clothing.create(item(userId));

    // 30 logs, but all in the previous calendar year → this year has 0.
    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => ({
        userId,
        logDate: prevYearJune(i + 1),
        clothingWorn: [{ itemId: clothing._id }],
      }))
    );

    const res = await request(app)
      .get('/api/analytics/annual-recap')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.code).toBe('RECAP_NOT_ENOUGH_LOGS');
  });

  test('?year= returns a completed past year scoped to that year', async () => {
    const clothing = await Clothing.create(item(userId));
    const prevYear = new Date().getUTCFullYear() - 1;

    // 30 logs in June of last year — enough for the gate when scoped to that year.
    await WearLog.create(
      Array.from({ length: 30 }, (_, i) => ({
        userId,
        logDate: prevYearJune(i + 1),
        clothingWorn: [{ itemId: clothing._id }],
      }))
    );

    const res = await request(app)
      .get(`/api/analytics/annual-recap?year=${prevYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.year).toBe(prevYear);
    expect(res.body.totalOutfits).toBe(30);
    expect(res.body.mostWornItem.name).toBe('Blue Tee');
    // June logs fall outside the year's final 90-day utilization window (Oct–Dec).
    expect(res.body.activeItems).toBe(0);
  });
});
