const errorHandler = require('../../src/middlewares/errorHandler');

// Build a fake Express res that records status + json payload.
const mockRes = () => {
  const res = {};
  res.statusCode = undefined;
  res.body = undefined;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

describe('errorHandler middleware', () => {
  test('ValidationError -> 422 with message', () => {
    const res = mockRes();
    errorHandler({ name: 'ValidationError', message: 'bad field' }, {}, res, () => {});
    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ error: 'bad field' });
  });

  test('CastError -> 400 invalid id', () => {
    const res = mockRes();
    errorHandler({ name: 'CastError' }, {}, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid ID format' });
  });

  test('duplicate key (code 11000) -> 409', () => {
    const res = mockRes();
    errorHandler({ code: 11000 }, {}, res, () => {});
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'Duplicate entry' });
  });

  test('custom .status error -> that status with message', () => {
    const res = mockRes();
    errorHandler({ status: 403, message: 'forbidden' }, {}, res, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  test('unknown error -> 500 generic, logs via console.error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();
    errorHandler(new Error('kaboom'), {}, res, () => {});
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
