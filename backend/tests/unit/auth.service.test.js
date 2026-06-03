const authService = require('../../src/services/auth.service');
const User = require('../../src/models/User');

const validUser = () => ({
  name: 'Service User',
  email: 'service@example.com',
  password: 'Password1!',
});

describe('auth.service — DB state assertions', () => {
  describe('deleteAccount', () => {
    test('soft-deletes by setting scheduledDeletionAt (BR3)', async () => {
      const { _id } = await authService.register(validUser());
      await authService.deleteAccount(_id);

      const user = await User.findById(_id);
      expect(user.scheduledDeletionAt).toBeInstanceOf(Date);
    });
  });

  describe('reactivate', () => {
    const creds = { email: 'service@example.com', password: 'Password1!' };

    beforeEach(async () => {
      const { _id } = await authService.register(validUser());
      await authService.deleteAccount(_id);
    });

    test('clears scheduledDeletionAt and returns a token', async () => {
      const result = await authService.reactivate(creds);
      expect(typeof result.token).toBe('string');

      const user = await User.findOne({ email: creds.email });
      expect(user.scheduledDeletionAt).toBeUndefined();
    });
  });
});
