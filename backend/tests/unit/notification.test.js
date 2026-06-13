const request = require('supertest');
const app = require('../../src/app');
const { Notification } = require('../../src/models');
const { NOTIFICATION_PAGE_SIZE } = require('../../src/config/constants');

describe('Notification API (/api/notifications)', () => {
  let tokenA;
  let userIdA;
  let userIdB;

  beforeEach(async () => {
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User A', email: 'a@example.com', password: 'Password1!' });
    tokenA = resA.body.token;
    userIdA = resA.body._id;

    const resB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User B', email: 'b@example.com', password: 'Password1!' });
    userIdB = resB.body._id;
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(401);
  });

  test('returns own notifications newest first with total and unreadCount', async () => {
    await Notification.create([
      {
        userId: userIdA,
        type: 'forgotten_item',
        message: 'Old',
        createdAt: new Date(Date.now() - 10000),
        isRead: true,
      },
      {
        userId: userIdA,
        type: 'recap_ready',
        message: 'New',
        createdAt: new Date(),
        isRead: false,
      },
    ]);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.notifications[0].message).toBe('New');
    expect(res.body.notifications[1].message).toBe('Old');
    expect(res.body.total).toBe(2);
    expect(res.body.unreadCount).toBe(1);
  });

  test('does not return other users notifications', async () => {
    await Notification.create({
      userId: userIdB,
      type: 'forgotten_item',
      message: 'Private message',
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('PATCH /:id/read marks own notification read', async () => {
    const notif = await Notification.create({
      userId: userIdA,
      type: 'forgotten_item',
      message: 'Unread',
      isRead: false,
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.isRead).toBe(true);
    // Immutability: only isRead changed
    expect(res.body.message).toBe('Unread');
    const inDb = await Notification.findById(notif._id);
    expect(inDb.isRead).toBe(true);
  });

  test('PATCH /:id/read on another users notification returns 404', async () => {
    const notifB = await Notification.create({
      userId: userIdB,
      type: 'forgotten_item',
      message: "Someone else's",
      isRead: false,
    });

    const res = await request(app)
      .patch(`/api/notifications/${notifB._id}/read`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(404);
    const inDb = await Notification.findById(notifB._id);
    expect(inDb.isRead).toBe(false);
  });

  test('limit query param is capped at the page size', async () => {
    const docs = Array.from({ length: NOTIFICATION_PAGE_SIZE + 5 }, (_, i) => ({
      userId: userIdA,
      type: 'forgotten_item',
      message: `Notification ${i}`,
    }));
    await Notification.create(docs);

    const res = await request(app)
      .get('/api/notifications?limit=100')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.notifications).toHaveLength(NOTIFICATION_PAGE_SIZE);
    expect(res.body.limit).toBe(NOTIFICATION_PAGE_SIZE);
    expect(res.body.total).toBe(NOTIFICATION_PAGE_SIZE + 5);

    const page2 = await request(app)
      .get('/api/notifications?page=2')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(page2.statusCode).toBe(200);
    expect(page2.body.notifications).toHaveLength(5);
    expect(page2.body.page).toBe(2);
  });
});
