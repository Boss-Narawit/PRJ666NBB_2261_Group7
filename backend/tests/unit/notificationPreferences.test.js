const request = require('supertest');
const app = require('../../src/app');

const validUser = () => ({
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'Password1!',
});

describe('Notification Preferences API (/api/notifications/preferences)', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(validUser());
    token = res.body.token;
  });

  describe('GET /api/notifications/preferences', () => {
    test('returns 200 with preferences when authenticated', async () => {
      const res = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notificationEnabled).toBe(true);
      expect(res.body.notificationFrequency).toBe('Daily');
      expect(res.body.itemStatusChangeEnabled).toBe(true);
      expect(res.body.forgottenItemAlertEnabled).toBe(true);
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/notifications/preferences');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /api/notifications/preferences', () => {
    test('updates preferences and returns 200 when authenticated', async () => {
      const res = await request(app)
        .patch('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          notificationEnabled: false,
          notificationFrequency: 'Weekly',
          itemStatusChangeEnabled: false,
          forgottenItemAlertEnabled: false,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.notificationEnabled).toBe(false);
      expect(res.body.notificationFrequency).toBe('Weekly');
      expect(res.body.itemStatusChangeEnabled).toBe(false);
      expect(res.body.forgottenItemAlertEnabled).toBe(false);
    });

    test('returns 401 when not authenticated', async () => {
      const res = await request(app)
        .patch('/api/notifications/preferences')
        .send({ notificationFrequency: 'Monthly' });

      expect(res.statusCode).toBe(401);
    });
  });
});
