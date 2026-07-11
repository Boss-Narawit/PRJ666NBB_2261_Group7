const { run } = require('../../src/jobs/itemCareReminders.job');
const { User, Clothing, Notification } = require('../../src/models');
const { REPURPOSE_UNWORN_DAYS } = require('../../src/config/constants');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * MS_PER_DAY);

describe('itemCareReminders job', () => {
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

  test('emits a repair_reminder for a Damaged item', async () => {
    const user = await makeUser();
    const item = await makeItem(user._id, { condition: 'Damaged' });

    const result = await run();

    expect(result.notificationsCreated).toBe(1);
    const notes = await Notification.find({ userId: user._id });
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe('repair_reminder');
    expect(notes[0].relatedId.toString()).toBe(item._id.toString());
  });

  test('emits a repurpose_suggestion for a still-good long-idle item', async () => {
    const user = await makeUser();
    const item = await makeItem(user._id, {
      analytics: { lastWornAt: daysAgo(REPURPOSE_UNWORN_DAYS + 10) },
    });

    const result = await run();

    expect(result.notificationsCreated).toBe(1);
    const notes = await Notification.find({ userId: user._id });
    expect(notes[0].type).toBe('repurpose_suggestion');
    expect(notes[0].relatedId.toString()).toBe(item._id.toString());
  });

  test('a Damaged idle item gets repair, not repurpose (no double-notify)', async () => {
    const user = await makeUser();
    await makeItem(user._id, {
      condition: 'Damaged',
      analytics: { lastWornAt: daysAgo(REPURPOSE_UNWORN_DAYS + 10) },
    });

    const result = await run();

    expect(result.notificationsCreated).toBe(1);
    const notes = await Notification.find({ userId: user._id });
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe('repair_reminder');
  });

  test('does not re-notify an item already reminded (dedup)', async () => {
    const user = await makeUser();
    await makeItem(user._id, { condition: 'Damaged' });

    await run();
    const result = await run();

    expect(result.notificationsCreated).toBe(0);
    expect(await Notification.countDocuments()).toBe(1);
  });

  test('ignores recently worn good items', async () => {
    const user = await makeUser();
    await makeItem(user._id, { analytics: { lastWornAt: daysAgo(5) } });

    const result = await run();

    expect(result.notificationsCreated).toBe(0);
  });

  test('skips users who disabled notifications (BR28)', async () => {
    const user = await makeUser({ notificationEnabled: false });
    await makeItem(user._id, { condition: 'Damaged' });

    const result = await run();

    expect(result.notificationsCreated).toBe(0);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('does not remind on Archived or Exported items (BR23)', async () => {
    const user = await makeUser();
    await makeItem(user._id, { condition: 'Damaged', status: 'Archived' });
    await makeItem(user._id, {
      status: 'Exported',
      analytics: { lastWornAt: daysAgo(REPURPOSE_UNWORN_DAYS + 10) },
    });

    const result = await run();

    expect(result.notificationsCreated).toBe(0);
  });
});
