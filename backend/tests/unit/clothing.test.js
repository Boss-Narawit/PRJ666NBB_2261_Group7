const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const Clothing = require('../../src/models/Clothing');
const { MAX_CLOTHING_BATCH, UPLOAD_MAX_FILE_SIZE_BYTES } = require('../../src/config/constants');

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

    test('missing required field returns 422 (ValidationError mapped in controller)', async () => {
      const { name, ...incomplete } = validItem(userId);
      const res = await request(app)
        .post('/api/clothing/upload')
        .set('Authorization', `Bearer ${token}`)
        .send(incomplete);
      expect(res.statusCode).toBe(422);
      expect(res.body.message).toBeDefined();
    });

    test('ignores a client-sent status — created items default to Available', async () => {
      const res = await request(app)
        .post('/api/clothing/upload')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validItem(userId), status: 'Exported' });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('Available');
    });
  });

  describe('POST /api/clothing/upload-image', () => {
    // Only the multer rejection paths are testable without Cloudinary — a valid
    // image would reach the controller and attempt a real upload.
    test('rejects a non-image file with 422', async () => {
      const res = await request(app)
        .post('/api/clothing/upload-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('not an image'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        });
      expect(res.statusCode).toBe(422);
      expect(res.body.error).toMatch(/image/i);
    });

    test('rejects an oversize file with 413 (LIMIT_FILE_SIZE)', async () => {
      const res = await request(app)
        .post('/api/clothing/upload-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.alloc(UPLOAD_MAX_FILE_SIZE_BYTES + 1), {
          filename: 'huge.jpg',
          contentType: 'image/jpeg',
        });
      expect(res.statusCode).toBe(413);
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

    test('invalid items return 422 (ValidationError mapped in controller)', async () => {
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .set('Authorization', `Bearer ${token}`)
        .send([{ name: 'broken' }]);
      expect(res.statusCode).toBe(422);
    });

    test('ignores a client-sent userId — items always belong to the requester', async () => {
      const other = await request(app).post('/api/auth/register').send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password1!',
      });
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .set('Authorization', `Bearer ${token}`)
        .send([validItem(other.body._id)]);
      expect(res.statusCode).toBe(201);
      expect(res.body[0].userId).toBe(userId);
      // nothing lands in the other user's wardrobe
      expect(await Clothing.countDocuments({ userId: other.body._id })).toBe(0);
    });

    test('rejects a batch over MAX_CLOTHING_BATCH with 422 (BR5)', async () => {
      const items = Array.from({ length: MAX_CLOTHING_BATCH + 1 }, () => validItem(userId));
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .set('Authorization', `Bearer ${token}`)
        .send(items);
      expect(res.statusCode).toBe(422);
      expect(await Clothing.countDocuments({})).toBe(0);
    });

    test('rejects a non-array body with 422', async () => {
      const res = await request(app)
        .post('/api/clothing/bulk-upload')
        .set('Authorization', `Bearer ${token}`)
        .send(validItem(userId));
      expect(res.statusCode).toBe(422);
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

    test('returns 400 on invalid ObjectId (CastError mapped in controller)', async () => {
      const res = await request(app)
        .get('/api/clothing/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
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

    test('returns 422 when colors is emptied (BR4)', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ colors: [] });
      expect(res.statusCode).toBe(422);
      const reloaded = await Clothing.findById(created._id);
      expect(reloaded.colors).toEqual(['blue']);
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

    test('ignores server-managed fields — analytics (BR9), userId, exportInfo are not client-writable', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Renamed Tee',
          analytics: { wearCount: 9999, lastWornAt: '2026-01-01' },
          userId: new mongoose.Types.ObjectId().toString(),
          exportInfo: { partnerName: 'Fake', type: 'resale', exportedAt: '2026-01-01' },
        });
      expect(res.statusCode).toBe(200);
      const reloaded = await Clothing.findById(created._id);
      expect(reloaded.name).toBe('Renamed Tee');
      expect(reloaded.analytics.wearCount).toBe(0);
      expect(reloaded.userId.toString()).toBe(userId);
      expect(reloaded.exportInfo.partnerName).toBeUndefined();
    });

    test('returns 400 on invalid ObjectId', async () => {
      const res = await request(app)
        .patch('/api/clothing/bad-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'x' });
      expect(res.statusCode).toBe(400);
    });

    test('rejects setting status to Exported with 422 (only the export flow may)', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Exported' });
      expect(res.statusCode).toBe(422);
      const reloaded = await Clothing.findById(created._id);
      expect(reloaded.status).toBe('Available');
    });

    test('rejects changing the status of an already-exported item with 422 (final)', async () => {
      const created = await Clothing.create({ ...validItem(userId), status: 'Exported' });
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Available' });
      expect(res.statusCode).toBe(422);
      const reloaded = await Clothing.findById(created._id);
      expect(reloaded.status).toBe('Exported');
    });

    test('rejects a null status with 422 (would silently unset the field)', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: null });
      expect(res.statusCode).toBe(422);
      const reloaded = await Clothing.findById(created._id);
      expect(reloaded.status).toBe('Available');
    });

    test('allows archiving an Available item with 200 (app archive flow)', async () => {
      const created = await Clothing.create(validItem(userId));
      const res = await request(app)
        .patch(`/api/clothing/${created._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Archived' });
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('Archived');
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

    test('returns 400 on invalid ObjectId', async () => {
      const res = await request(app)
        .delete('/api/clothing/bad-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
    });
  });
});
