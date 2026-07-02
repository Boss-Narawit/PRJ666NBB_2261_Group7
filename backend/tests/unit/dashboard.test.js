const request = require('supertest');
const app = require('../../src/app');
const { User, Clothing, WearLog } = require('../../src/models');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY);
// WearLog.logDate is stored as midnight UTC
const midnightUTC = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

describe('Dashboard API (/api/dashboard/summary)', () => {
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

  const makeItem = (overrides = {}) => ({
    userId,
    name: 'Item',
    brand: 'Brand',
    category: 'tops',
    colors: ['blue'],
    size: 'M',
    imageUrl: 'http://x.com/a.jpg',
    condition: 'Good',
    ...overrides,
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.statusCode).toBe(401);
  });

  test('returns wardrobe counts and forgotten preview (BR11)', async () => {
    await Clothing.create([
      makeItem({ name: 'Recent', analytics: { lastWornAt: new Date() } }),
      makeItem({ name: 'Forgotten', analytics: { lastWornAt: daysAgo(40) } }),
      makeItem({
        name: 'ArchivedOld',
        status: 'Archived',
        analytics: { lastWornAt: daysAgo(40) },
      }),
      makeItem({ name: 'NeverWorn', createdAt: daysAgo(40) }),
    ]);

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.userName).toBe('Test User');
    // Archived/Exported items are excluded — the stat must match the wardrobe view
    expect(res.body.totalItems).toBe(3);
    // Default threshold 30 days: worn 40d ago + never worn (created 40d ago)
    expect(res.body.forgottenCount).toBe(2);
    const names = res.body.forgottenItems.map((i) => i.name).sort();
    expect(names).toEqual(['Forgotten', 'NeverWorn']);
    // No wear logs exist — derived from WearLog, not from analytics cache (BR9)
    expect(res.body.wornThisMonth).toBe(0);
  });

  test('respects the user threshold preference (BR11/BR12)', async () => {
    await Clothing.create(makeItem({ analytics: { lastWornAt: daysAgo(10) } }));

    // Default threshold (30 days): a 10-day-old wear is not forgotten
    let res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.forgottenCount).toBe(0);

    // Lower the threshold to the minimum (7 days): now it is forgotten
    await User.updateOne({ _id: userId }, { 'preferences.forgottenItemThresholdDays': 7 });
    res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`);
    expect(res.body.forgottenCount).toBe(1);
  });

  test('excludes Archived items from forgotten (BR23)', async () => {
    await Clothing.create(makeItem({ status: 'Archived', analytics: { lastWornAt: daysAgo(60) } }));

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    // Archived items count neither toward totalItems nor forgotten
    expect(res.body.totalItems).toBe(0);
    expect(res.body.forgottenCount).toBe(0);
    expect(res.body.forgottenItems).toEqual([]);
  });

  test('wornThisMonth counts distinct items worn this month', async () => {
    const itemA = await Clothing.create(makeItem({ name: 'A' }));
    const itemB = await Clothing.create(makeItem({ name: 'B' }));

    await WearLog.create({
      userId,
      logDate: midnightUTC(new Date()),
      // itemA appears twice — must still count once
      clothingWorn: [{ itemId: itemA._id }, { itemId: itemA._id }, { itemId: itemB._id }],
    });
    // A wear log from a previous month must not count
    await WearLog.create({
      userId,
      logDate: midnightUTC(daysAgo(40)),
      clothingWorn: [{ itemId: itemB._id }],
    });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.wornThisMonth).toBe(2);
  });
});
