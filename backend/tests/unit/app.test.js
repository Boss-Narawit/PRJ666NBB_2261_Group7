const request = require('supertest');
const app = require('../../src/app');

describe('app.js wiring', () => {
  test('unknown route returns 404', async () => {
    const res = await request(app).get('/no/such/route');
    expect(res.statusCode).toBe(404);
  });

  test('parses JSON body (echoed back via clothing validation error)', async () => {
    // Posting JSON exercises express.json(); a bad body still reaches the handler.
    const res = await request(app)
      .post('/api/clothing/upload')
      .set('Content-Type', 'application/json')
      .send({ name: 'only-name' });
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBeDefined();
  });
});
