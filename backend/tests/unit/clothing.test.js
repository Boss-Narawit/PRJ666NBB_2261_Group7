const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Clothing = require('../../src/models/Clothing');

// Minimal valid payload — Clothing requires userId, name, brand, category,
// colors, size, imageUrl, condition (BR4 / Mongoose schema).
const validItem = (userId) => ({
  userId: userId,
  name: 'Blue Tee',
  brand: 'Uniqlo',
  category: 'tops',
  colors: ['blue'],
  size: 'M',
  imageUrl: 'https://example.com/tee.png',
  condition: 'Good',
});

describe('Clothing API (/api/clothing)', () => {
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

  describe('POST /api/clothing/upload', () => {
    test('creates an item and returns 201 with _id', async () => {
      const res = await request(app)
        .post('/api/clothing/upload')
        .set('Authorization', `Bearer ${token}`)
        .send(validItem(userId));
      expect(res.statusCode).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe('Blue Tee');
    });

    test('missing required field returns 500 (validation error caught in controller)', async () => {
      const { name, ...incomplete } = validItem(userId);
      const res = await request(app)
        .post('/api/clothing/upload')
        .set('Authorization', `Bearer ${token}`)
        .send(incomplete);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/clothing/bulk-upload', () => {
    test('inserts many items and returns 201 with an array', async () => {
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .set('Authorization', `Bearer ${token}`)
        .send([validItem(userId), validItem(userId)]);
      expect(res.statusCode).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    test('invalid items return 500', async () => {
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .set('Authorization', `Bearer ${token}`)
        .send([{ name: 'broken' }]);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/clothing', () => {
    test('returns 200 with all items', async () => {
      await Clothing.create(validItem(userId));
      await Clothing.create(validItem(userId));
      const res = await request(app).get('/api/clothing').set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/clothing/:id', () => {
    test('returns 200 with the item when found', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .get(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(created._id.toString());
    });

    test('returns 404 when not found', async () => {
      const res = await request(app)
        .get(`/api/clothing/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Clothing item not found');
    });

    test('returns 500 on invalid ObjectId (CastError caught in controller)', async () => {
      const res = await request(app)
        .get('/api/clothing/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('PATCH /api/clothing/:id', () => {
    test('updates and returns 200 with new value', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed Tee' });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Renamed Tee');
    });

    test('returns 422 on an invalid enum value (runValidators)', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ condition: 'BrandNew' });
      expect(res.statusCode).toBe(422);
      // value must not have been persisted
      const reloaded = await Clothing.findById(created._id);
      expect(reloaded.condition).toBe(created.condition);
    });

    test('returns 404 when updating a missing item', async () => {
      const res = await request(app)
        .patch(`/api/clothing/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nope' });
      expect(res.statusCode).toBe(404);
    });

    test('returns 500 on invalid ObjectId', async () => {
      const res = await request(app)
        .patch('/api/clothing/bad-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'x' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /api/clothing/:id', () => {
    test('deletes and returns 200', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .delete(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Clothing item deleted');
      expect(await Clothing.findById(created._id)).toBeNull();
    });

    test('returns 404 when deleting a missing item', async () => {
      const res = await request(app)
        .delete(`/api/clothing/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });

    test('returns 500 on invalid ObjectId', async () => {
      const res = await request(app)
        .delete('/api/clothing/bad-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(500);
    });
  });
});
