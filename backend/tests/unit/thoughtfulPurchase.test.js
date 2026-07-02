const request = require('supertest');
const app = require('../../src/app');
const ThoughtfulPurchase = require('../../src/models/ThoughtfulPurchase');
const { COOLDOWN_MIN_MINUTES } = require('../../src/config/constants');

describe('Thoughtful Purchase API (/api/thoughtful-purchase)', () => {
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
    const res = await request(app).post('/api/thoughtful-purchase').send({});
    expect(res.statusCode).toBe(401);
  });

  test('rejects a cooldown shorter than 24h (BR14)', async () => {
    const res = await request(app)
      .post('/api/thoughtful-purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemName: 'Sneakers', cooldownMinutes: COOLDOWN_MIN_MINUTES - 1 });

    expect(res.statusCode).toBe(400);
  });

  test('creates a pending purchase with a valid cooldown (BR14)', async () => {
    const res = await request(app)
      .post('/api/thoughtful-purchase')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemName: 'Sneakers', cooldownMinutes: COOLDOWN_MIN_MINUTES });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(new Date(res.body.cooldownEndsAt).getTime()).toBeGreaterThan(Date.now());
  });

  test('a decided purchase cannot be re-decided (approve/reject only from pending)', async () => {
    // Created directly with an already-expired cooldown to skip the BR14 minimum.
    const purchase = await ThoughtfulPurchase.create({
      userId,
      itemName: 'Sneakers',
      cooldownEndsAt: new Date(Date.now() - 1000),
      status: 'pending',
    });

    const approved = await request(app)
      .patch(`/api/thoughtful-purchase/approve/${purchase._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(approved.statusCode).toBe(200);
    expect(approved.body.status).toBe('approved');

    const reject = await request(app)
      .patch(`/api/thoughtful-purchase/reject/${purchase._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(reject.statusCode).toBe(422);

    const reApprove = await request(app)
      .patch(`/api/thoughtful-purchase/approve/${purchase._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(reApprove.statusCode).toBe(422);

    // The decision must not have been flipped by the rejected attempts.
    const reloaded = await ThoughtfulPurchase.findById(purchase._id);
    expect(reloaded.status).toBe('approved');
  });
});
