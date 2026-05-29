const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Clothing = require('../../src/models/Clothing');

// Minimal valid payload — Clothing requires userId, name, brand, category,
// colors, size, imageUrl, condition (BR4 / Mongoose schema).
const validItem = () => ({
  userId: new mongoose.Types.ObjectId().toString(),
  name: 'Blue Tee',
  brand: 'Uniqlo',
  category: 'tops',
  colors: ['blue'],
  size: 'M',
  imageUrl: 'https://example.com/tee.png',
  condition: 'Good',
});

describe('Clothing API (/api/clothing)', () => {
  describe('POST /api/clothing/upload', () => {
    test('creates an item and returns 201 with _id', async () => {
      const res = await request(app).post('/api/clothing/upload').send(validItem());
      expect(res.statusCode).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.name).toBe('Blue Tee');
    });

    test('missing required field returns 500 (validation error caught in controller)', async () => {
      const { name, ...incomplete } = validItem();
      const res = await request(app).post('/api/clothing/upload').send(incomplete);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('POST /api/clothing/bulk-upload', () => {
    test('inserts many items and returns 201 with an array', async () => {
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .send([validItem(), validItem()]);
      expect(res.statusCode).toBe(201);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    test('invalid items return 500', async () => {
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .send([{ name: 'broken' }]);
      expect(res.statusCode).toBe(500);
    });
  });

  describe('GET /api/clothing', () => {
    test('returns 200 with all items', async () => {
      await Clothing.create(validItem());
      await Clothing.create(validItem());
      const res = await request(app).get('/api/clothing');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/clothing/:id', () => {
    test('returns 200 with the item when found', async () => {
      const created = await Clothing.create(validItem());
      const res = await request(app).get(`/api/clothing/${created._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(created._id.toString());
    });

    test('returns 404 when not found', async () => {
      const res = await request(app).get(`/api/clothing/${new mongoose.Types.ObjectId()}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Clothing item not found');
    });

    test('returns 500 on invalid ObjectId (CastError caught in controller)', async () => {
      const res = await request(app).get('/api/clothing/not-a-valid-id');
      expect(res.statusCode).toBe(500);
    });
  });

  describe('PATCH /api/clothing/:id', () => {
    test('updates and returns 200 with new value', async () => {
      const created = await Clothing.create(validItem());
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .send({ name: 'Renamed Tee' });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Renamed Tee');
    });

    test('returns 404 when updating a missing item', async () => {
      const res = await request(app)
        .patch(`/api/clothing/${new mongoose.Types.ObjectId()}`)
        .send({ name: 'Nope' });
      expect(res.statusCode).toBe(404);
    });

    test('returns 500 on invalid ObjectId', async () => {
      const res = await request(app).patch('/api/clothing/bad-id').send({ name: 'x' });
      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /api/clothing/:id', () => {
    test('deletes and returns 200', async () => {
      const created = await Clothing.create(validItem());
      const res = await request(app).delete(`/api/clothing/${created._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Clothing item deleted');
      expect(await Clothing.findById(created._id)).toBeNull();
    });

    test('returns 404 when deleting a missing item', async () => {
      const res = await request(app).delete(`/api/clothing/${new mongoose.Types.ObjectId()}`);
      expect(res.statusCode).toBe(404);
    });

    test('returns 500 on invalid ObjectId', async () => {
      const res = await request(app).delete('/api/clothing/bad-id');
      expect(res.statusCode).toBe(500);
    });
  });
});
