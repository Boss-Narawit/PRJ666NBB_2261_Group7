const { run } = require('../../src/jobs/expireTimers.job');
const { User, ThoughtfulPurchase, Notification } = require('../../src/models');

const MS_PER_MIN = 60 * 1000;
const minsAgo = (n) => new Date(Date.now() - n * MS_PER_MIN);
const minsFromNow = (n) => new Date(Date.now() + n * MS_PER_MIN);

describe('expireTimers job', () => {
  const makeUser = (overrides = {}) =>
    User.create({
      name: 'U',
      email: `u${Math.random()}@x.com`,
      password: 'Password1!',
      ...overrides,
    });

  const makePurchase = (userId, overrides = {}) =>
    ThoughtfulPurchase.create({
      userId,
      itemName: 'Sneakers',
      cooldownEndsAt: minsAgo(5),
      status: 'pending',
      ...overrides,
    });

  test('notifies once when the cooling-off period has ended and stamps the purchase (BR15)', async () => {
    const user = await makeUser();
    const purchase = await makePurchase(user._id);

    const result = await run();

    expect(result.notificationsCreated).toBe(1);
    const notes = await Notification.find({ userId: user._id });
    expect(notes).toHaveLength(1);
    expect(notes[0].type).toBe('cooldown_reminder');
    expect(notes[0].relatedId.toString()).toBe(purchase._id.toString());

    const refreshed = await ThoughtfulPurchase.findById(purchase._id);
    expect(refreshed.cooldownReminderSentAt).toBeTruthy();
  });

  test('does not re-notify a purchase already reminded', async () => {
    const user = await makeUser();
    await makePurchase(user._id, { cooldownReminderSentAt: minsAgo(1) });

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
  });

  test('ignores purchases whose cooling-off period has not ended yet', async () => {
    const user = await makeUser();
    await makePurchase(user._id, { cooldownEndsAt: minsFromNow(60) });

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
  });

  test('ignores purchases that are no longer pending', async () => {
    const user = await makeUser();
    await makePurchase(user._id, { status: 'approved' });

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
  });

  test('skips users who disabled notifications (BR28)', async () => {
    const user = await makeUser({ notificationEnabled: false });
    await makePurchase(user._id);

    const result = await run();
    expect(result.notificationsCreated).toBe(0);
    expect(await Notification.countDocuments()).toBe(0);
  });
});
