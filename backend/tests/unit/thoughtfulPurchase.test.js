const request = require('supertest');
const app = require('../../src/app');
const { COOLDOWN_MIN_MINUTES } = require('../../src/config/constants');

describe('Thoughtful Purchase API (/api/thoughtful-purchase)', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1!',
    });
    token = res.body.token;
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
});
