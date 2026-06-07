const request = require('supertest');
const app = require('../../src/app');

const validUser = () => ({
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Password1!',
});

describe('User Profile API (/api/users)', () => {
  let token;

  beforeEach(async () => {
    const res1 = await request(app).post('/api/auth/register').send(validUser());
    token = res1.body.token;
  });

  describe('GET /api/users/me', () => {
    test('returns 200 with user profile when authenticated', async () => {
      const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Jane Doe');
      expect(res.body.email).toBe('jane@example.com');
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    test('updates profile name and returns 200 when authenticated (email remains unchanged)', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Jane Updated', email: 'jane.new@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Jane Updated');
      expect(res.body.email).toBe('jane@example.com');
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app).patch('/api/users/me').send({ name: 'Jane Updated' });

      expect(res.statusCode).toBe(401);
    });
  });
});
