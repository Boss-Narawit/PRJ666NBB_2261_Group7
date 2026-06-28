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

  test('rejects a second log on the same day with 409 (BR8)', async () => {
    const payload = { logDate: '2026-06-15', clothingWorn: [{ itemId }] };
    await request(app).post('/api/wear-logs').set('Authorization', `Bearer ${token}`).send(payload);

    const res = await request(app)
      .post('/api/wear-logs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toBe(409);
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
});
