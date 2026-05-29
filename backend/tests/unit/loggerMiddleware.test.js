const loggerMiddleware = require('../../src/middlewares/loggerMiddleware');

describe('loggerMiddleware', () => {
  test('logs the request and calls next()', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const next = jest.fn();
    loggerMiddleware({ method: 'GET', url: '/api/health' }, {}, next);
    expect(spy).toHaveBeenCalledWith('GET /api/health');
    expect(next).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
