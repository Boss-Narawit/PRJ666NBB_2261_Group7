const { run } = require('../../src/jobs/annualRecap.job');
const { User, Clothing, WearLog, Notification } = require('../../src/models');
const { ANNUAL_RECAP_MIN_LOGS } = require('../../src/config/constants');

const completedYear = new Date().getUTCFullYear() - 1;
const dayInCompletedYear = (day) => new Date(Date.UTC(completedYear, 5, day)); // June

describe('annualRecap job', () => {
  const makeUser = (overrides = {}) =>
    User.create({
      name: 'U',
      email: `u${Math.random()}@x.com`,
      password: 'Password1!',
      ...overrides,
    });

  const makeItem = (userId) =>
    Clothing.create({
      userId,
      name: 'Tee',
      brand: 'Brand',
      category: 'tops',
      colors: ['blue'],
      size: 'M',
      imageUrl: 'http://x.com/a.jpg',
      condition: 'Good',
    });

  const logDays = (userId, itemId, n, dateFor) =>
    WearLog.create(
      Array.from({ length: n }, (_, i) => ({
        userId,
        logDate: dateFor(i + 1),
        clothingWorn: [{ itemId }],
      }))
    );

  test('emits recap_ready for a user at the log minimum in the completed year (BR25/BR26)', async () => {
    const user = await makeUser();
    const item = await makeItem(user._id);
    await logDays(user._id, item._id, ANNUAL_RECAP_MIN_LOGS, dayInCompletedYear);

    const result = await run();

    expect(result.year).toBe(completedYear);
    expect(result.notificationsCreated).toBe(1);
    const notes = await Notification.find({ userId: user._id });
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe('recap_ready');
    expect(notes[0].message).toContain(String(completedYear));
  });

  test('skips a user below the log minimum (BR25)', async () => {
    const user = await makeUser();
    const item = await makeItem(user._id);
    await logDays(user._id, item._id, ANNUAL_RECAP_MIN_LOGS - 1, dayInCompletedYear);

    const result = await run();

    expect(result.notificationsCreated).toBe(0);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('skips users who disabled notifications (BR28)', async () => {
    const user = await makeUser({ notificationEnabled: false });
    const item = await makeItem(user._id);
    await logDays(user._id, item._id, ANNUAL_RECAP_MIN_LOGS, dayInCompletedYear);

    const result = await run();

    expect(result.notificationsCreated).toBe(0);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('does not count the current year toward the completed-year gate', async () => {
    const user = await makeUser();
    const item = await makeItem(user._id);
    const thisYear = new Date().getUTCFullYear();
    await logDays(
      user._id,
      item._id,
      ANNUAL_RECAP_MIN_LOGS,
      (day) => new Date(Date.UTC(thisYear, 5, day))
    );

    const result = await run();

    expect(result.notificationsCreated).toBe(0);
  });
});
