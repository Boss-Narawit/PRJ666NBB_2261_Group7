const request = require('supertest');
const app = require('../../src/app');
const { Clothing } = require('../../src/models');

describe('WearLog API (/api/wear-logs)', () => {
  let token;
  let userId;
  let itemId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User A', email: 'a@example.com', password: 'Password1!' });
    token = res.body.token;
    userId = res.body._id;

    const item = await Clothing.create({
      userId,
      name: 'Blue Shirt',
      brand: 'Uniqlo',
      category: 'tops',
      colors: ['Blue'],
      size: 'M',
      imageUrl: 'http://example.com/shirt.jpg',
      condition: 'Good',
    });
    itemId = item._id.toString();
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/wear-logs');
    expect(res.statusCode).toBe(401);
  });

  test('creates a wear log and syncs item analytics (BR9)', async () => {
    const res = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    expect(res.statusCode).toBe(201);
    expect(res.body._id).toBeDefined();

    const item = await Clothing.findById(itemId);
    expect(item.analytics.wearCount).toBe(1);
    expect(new Date(item.analytics.lastWornAt).toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  test('normalizes logDate to midnight UTC', async () => {
    const res = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        logDate: '2026-06-15T14:30:00.000Z',
        clothingWorn: [{ itemId }],
      });

    expect(res.statusCode).toBe(201);
    expect(new Date(res.body.logDate).toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  test('allows multiple outfit logs on the same day, each its own document (BR8)', async () => {
    // First outfit logged for the day.
    await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }], occasion: 'Work' });

    const second = await Clothing.create({
      userId,
      name: 'Black Jeans',
      brand: 'Levi',
      category: 'bottoms',
      colors: ['Black'],
      size: '32',
      imageUrl: 'http://example.com/jeans.jpg',
      condition: 'Good',
    });

    // A second outfit the same day → a NEW log document, not a merge, not a 409.
    const res = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        logDate: '2026-06-15',
        clothingWorn: [{ itemId: second._id }],
        occasion: 'Evening hangout',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.clothingWorn).toHaveLength(1);
    expect(res.body.occasion).toBe('Evening hangout');

    // Two separate log documents for the day, each with its own items/occasion.
    const list = await request(app).get('/api/wear-logs').set('Authorization', `Bearer ${token}`);
    expect(list.body.total).toBe(2);
    const occasions = list.body.wearLogs.map((l) => l.occasion).sort();
    expect(occasions).toEqual(['Evening hangout', 'Work']);
  });

  test('an item present in two same-day logs has wearCount 2 (BR9)', async () => {
    for (const occasion of ['Work', 'Evening hangout']) {
      const res = await request(app)
        .post('/api/wear-logs')
        .set('Authorization', `Bearer ${token}`)
        .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }], occasion });
      expect(res.statusCode).toBe(201);
    }

    const item = await Clothing.findById(itemId);
    expect(item.analytics.wearCount).toBe(2);
    expect(new Date(item.analytics.lastWornAt).toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  test('dedupes an item listed twice within one outfit (no double count)', async () => {
    const res = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }, { itemId }] });

    expect(res.statusCode).toBe(201);
    expect(res.body.clothingWorn).toHaveLength(1);
    expect((await Clothing.findById(itemId)).analytics.wearCount).toBe(1);
  });

  test('lists own wear logs newest first with populated items', async () => {
    await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-14', clothingWorn: [{ itemId }] });
    await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app).get('/api/wear-logs').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.wearLogs).toHaveLength(2);
    expect(new Date(res.body.wearLogs[0].logDate).toISOString()).toBe('2026-06-15T00:00:00.000Z');
    expect(res.body.wearLogs[0].clothingWorn[0].itemId.name).toBe('Blue Shirt');
  });

  test('filters wear logs by startDate/endDate range', async () => {
    for (const logDate of ['2026-06-10', '2026-06-15', '2026-06-20']) {
      await request(app)
        .post('/api/wear-logs')
        .set('Authorization', `Bearer ${token}`)
        .send({ logDate, clothingWorn: [{ itemId }] });
    }

    const res = await request(app)
      .get('/api/wear-logs?startDate=2026-06-14&endDate=2026-06-16')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.wearLogs).toHaveLength(1);
    expect(new Date(res.body.wearLogs[0].logDate).toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  test('deleting a wear log reverts item analytics (BR9)', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const del = await request(app)
      .delete(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.statusCode).toBe(200);

    const item = await Clothing.findById(itemId);
    expect(item.analytics.wearCount).toBe(0);
    expect(item.analytics.lastWornAt).toBeNull();
  });

  test('gets a single wear log by id with populated items', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .get(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(created.body._id);
    expect(res.body.clothingWorn[0].itemId.name).toBe('Blue Shirt');
  });

  test('returns 404 for a wear log that does not exist', async () => {
    const missingId = new (require('mongoose').Types.ObjectId)().toString();
    const res = await request(app)
      .get(`/api/wear-logs/${missingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });

  test('rejects logging an item not in the user wardrobe (422)', async () => {
    const otherItem = await Clothing.create({
      userId: new (require('mongoose').Types.ObjectId)(),
      name: 'Not Yours',
      brand: 'X',
      category: 'tops',
      colors: ['Red'],
      size: 'S',
      imageUrl: 'http://example.com/x.jpg',
      condition: 'Good',
    });

    const res = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        logDate: '2026-06-15',
        clothingWorn: [{ itemId: otherItem._id.toString() }],
      });

    expect(res.statusCode).toBe(422);
  });

  test('updates occasion/notes without touching items (BR10)', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ occasion: 'Work', notes: 'Rainy day' });

    expect(res.statusCode).toBe(200);
    expect(res.body.occasion).toBe('Work');
    expect(res.body.notes).toBe('Rainy day');
  });

  test('editing logDate alone recomputes lastWornAt (BR9/BR10)', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-20' });

    expect(res.statusCode).toBe(200);
    const item = await Clothing.findById(itemId);
    expect(item.analytics.wearCount).toBe(1);
    expect(new Date(item.analytics.lastWornAt).toISOString()).toBe('2026-06-20T00:00:00.000Z');
  });

  test('swapping items recomputes analytics for removed and added items (BR9)', async () => {
    const second = await Clothing.create({
      userId,
      name: 'Red Pants',
      brand: 'Levi',
      category: 'bottoms',
      colors: ['Red'],
      size: 'M',
      imageUrl: 'http://example.com/pants.jpg',
      condition: 'Good',
    });
    const secondId = second._id.toString();

    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clothingWorn: [{ itemId: secondId }] });

    expect(res.statusCode).toBe(200);

    const removed = await Clothing.findById(itemId);
    expect(removed.analytics.wearCount).toBe(0);
    expect(removed.analytics.lastWornAt).toBeNull();

    const added = await Clothing.findById(secondId);
    expect(added.analytics.wearCount).toBe(1);
    expect(new Date(added.analytics.lastWornAt).toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  test('returns 401 when updating without a token', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .send({ occasion: 'Work' });

    expect(res.statusCode).toBe(401);
  });

  test('returns 404 when updating a wear log that does not exist', async () => {
    const missingId = new (require('mongoose').Types.ObjectId)().toString();
    const res = await request(app)
      .patch(`/api/wear-logs/${missingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ occasion: 'Work' });

    expect(res.statusCode).toBe(404);
  });

  test('rejects an empty clothingWorn array on update (422)', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clothingWorn: [] });

    expect(res.statusCode).toBe(422);
  });

  test('rejects updating to an item not in the user wardrobe (422)', async () => {
    const otherItem = await Clothing.create({
      userId: new (require('mongoose').Types.ObjectId)(),
      name: 'Not Yours',
      brand: 'X',
      category: 'tops',
      colors: ['Red'],
      size: 'S',
      imageUrl: 'http://example.com/x.jpg',
      condition: 'Good',
    });

    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clothingWorn: [{ itemId: otherItem._id.toString() }] });

    expect(res.statusCode).toBe(422);
  });

  test('allows editing a log onto a day that already has a log (BR8)', async () => {
    await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-10', clothingWorn: [{ itemId }] });
    const target = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    const res = await request(app)
      .patch(`/api/wear-logs/${target.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-10' });

    expect(res.statusCode).toBe(200);
    expect(new Date(res.body.logDate).toISOString()).toBe('2026-06-10T00:00:00.000Z');

    // Both logs now share the same day.
    const list = await request(app)
      .get('/api/wear-logs?startDate=2026-06-10&endDate=2026-06-10')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.total).toBe(2);
  });

  test('persists outfitName on create and returns it from list + detail', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }], outfitName: 'Work Fit' });

    expect(created.statusCode).toBe(201);
    expect(created.body.outfitName).toBe('Work Fit');

    const list = await request(app).get('/api/wear-logs').set('Authorization', `Bearer ${token}`);
    expect(list.body.wearLogs[0].outfitName).toBe('Work Fit');

    const detail = await request(app)
      .get(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.body.outfitName).toBe('Work Fit');
  });

  test('leaves outfitName unset when omitted on create', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }] });

    expect(created.statusCode).toBe(201);
    expect(created.body.outfitName).toBeUndefined();
  });

  test('can change outfitName via PATCH (BR10)', async () => {
    const created = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({ logDate: '2026-06-15', clothingWorn: [{ itemId }], outfitName: 'Work Fit' });

    const res = await request(app)
      .patch(`/api/wear-logs/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ outfitName: 'Evening Fit' });

    expect(res.statusCode).toBe(200);
    expect(res.body.outfitName).toBe('Evening Fit');
  });
});
