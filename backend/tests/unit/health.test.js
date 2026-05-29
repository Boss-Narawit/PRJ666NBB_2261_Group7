const request = require('supertest');
const app = require('../../src/app');

describe('GET /api/health', () => {
  test('returns 200 with running message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Server is running');
  });
});
