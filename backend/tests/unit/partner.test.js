const request = require('supertest');
const app = require('../../src/app');
const { Partner } = require('../../src/models');

describe('Partner API (/api/partners)', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1!',
    });
    token = res.body.token;

    await Partner.create([
      { name: 'Resale Co', type: 'resale', isActive: true },
      { name: 'Donate Co', type: 'donation', isActive: true },
      { name: 'Gone Co', type: 'resale', isActive: false },
    ]);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/partners');
    expect(res.statusCode).toBe(401);
  });

  test('lists only active partners (BR30)', async () => {
    const res = await request(app).get('/api/partners').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((p) => p.isActive)).toBe(true);
  });

  test('filters by type', async () => {
    const res = await request(app)
      .get('/api/partners?type=donation')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].type).toBe('donation');
  });
});
