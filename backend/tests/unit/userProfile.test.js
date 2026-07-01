const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

const validUser = () => ({
  name: 'Profile Test User',
  email: 'profile@example.com',
  password: 'Password1!',
});

let authToken;
let userId;

describe('User Profile & Account API (/api/users & /api/auth)', () => {
  beforeEach(async () => {
    // Register a user before each test
    const res = await request(app).post('/api/auth/register').send(validUser());
    authToken = res.body.token;
    userId = res.body._id;
  });

  afterEach(async () => {
    // Clean up
    await User.deleteMany({ email: validUser().email });
  });

  describe('GET /api/users/me - Get current user profile', () => {
    test('returns 200 with complete user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        _id: userId.toString(),
        name: 'Profile Test User',
        email: 'profile@example.com',
      });
      expect(res.body.password).toBeUndefined();
    });

    test('returns 401 when no token provided', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.statusCode).toBe(401);
    });

    test('returns 401 when invalid token provided', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/users/me - Update user profile', () => {
    test('updates name successfully and returns 200', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.email).toBe('profile@example.com');
    });

    test('cannot update email address (security)', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'hacked@example.com' });

      expect(res.body.email).toBe('profile@example.com');
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app).patch('/api/users/me').send({ name: 'Should Fail' });
      expect(res.statusCode).toBe(401);
    });

    test('persists forgottenItemThresholdDays (BR11/BR12)', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ forgottenItemThresholdDays: 21 });

      expect(res.statusCode).toBe(200);
      expect(res.body.preferences.forgottenItemThresholdDays).toBe(21);

      const user = await User.findById(userId);
      expect(user.preferences.forgottenItemThresholdDays).toBe(21);
    });

    test('rejects a threshold below the BR12 minimum of 7 days', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ forgottenItemThresholdDays: 3 });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);

      const user = await User.findById(userId);
      expect(user.preferences.forgottenItemThresholdDays).not.toBe(3);
    });
  });

  describe('DELETE /api/auth/delete-account - Account deletion (BR3)', () => {
    test('soft-deletes account and returns 200', async () => {
      const res = await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Account scheduled for deletion');

      const user = await User.findById(userId);
      expect(user.scheduledDeletionAt).toBeDefined();
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/auth/delete-account');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/reactivate - Reactivate pending deletion account', () => {
    beforeEach(async () => {
      await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${authToken}`);
    });

    test('reactivates account and returns new token', async () => {
      const res = await request(app)
        .post('/api/auth/reactivate')
        .send({ email: 'profile@example.com', password: 'Password1!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'profile@example.com', password: 'Password1!' });
      expect(loginRes.statusCode).toBe(200);
    });

    test('returns 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/reactivate')
        .send({ email: 'profile@example.com', password: 'WrongPass1!' });
      expect(res.statusCode).toBe(401);
    });
  });
});
