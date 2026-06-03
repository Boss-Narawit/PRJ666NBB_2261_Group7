const request = require('supertest');
const app = require('../../src/app');

describe('app.js wiring', () => {
  test('unknown route returns 404', async () => {
    const res = await request(app).get('/no/such/route');
    expect(res.statusCode).toBe(404);
  });
});
