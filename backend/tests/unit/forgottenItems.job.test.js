const { run } = require('../../src/jobs/forgottenItems.job');
const { User, Clothing, Notification } = require('../../src/models');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY);

describe('forgottenItems job', () => {
  const makeUser = (overrides = {}) =>
    User.create({
      name: 'U',
      email: `u${Math.random()}@x.com`,
      password: 'Password1!',
      ...overrides,
    });

  const makeItem = (userId, overrides = {}) =>
    Clothing.create({
      userId,
      name: 'Coat',
      brand: 'Brand',
      category: 'outerwear',
      colors: ['blue'],
      size: 'M',
      imageUrl: 'http://x.com/a.jpg',
      condition: 'Good',
      ...overrides,
    });

  test('creates a notification for a forgotten item and stamps lastNotifiedAt (BR11/BR13)', async () => {
    const user = await makeUser();
    const item = await makeItem(user._id, { analytics: { lastWornAt: daysAgo(40) } });

    const result = await run();

    expect(result.notificationsCreated).toBe(1);
    const notes = await Notification.find({ userId: user._id });
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe('forgotten_item');
    expect(notes[0].relatedId.toString()).toBe(item._id.toString());

    const refreshed = await Clothing.findById(item._id);
    expect(refreshed.analytics.lastNotifiedAt).toBeTruthy();
  });

  test('does not re-notify within the cooldown window (BR13)', async () => {
    const user = await makeUser();
    await makeItem(user._id, {
      analytics: { lastWornAt: daysAgo(40), lastNotifiedAt: daysAgo(2) },
    });

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
  });

  test('skips users who disabled notifications (BR28)', async () => {
    const user = await makeUser({ notificationEnabled: false });
    await makeItem(user._id, { analytics: { lastWornAt: daysAgo(40) } });

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('ignores recently worn items', async () => {
    const user = await makeUser();
    await makeItem(user._id, { analytics: { lastWornAt: daysAgo(5) } });

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
  });
});
