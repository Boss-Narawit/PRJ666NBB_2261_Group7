const request = require('supertest');
const app = require('../../src/app');

describe('Stub routes', () => {
  test.each([
    ['post', '/api/auth/logout'],
    ['post', '/api/auth/refresh'],
    ['delete', '/api/auth/delete-account'],
    ['get', '/api/users/me'],
    ['patch', '/api/users/me'],
    ['patch', '/api/users/notification-settings'],
    ['post', '/api/wear-logs'],
    ['get', '/api/wear-logs'],
    ['get', '/api/wear-logs/123'],
    ['delete', '/api/wear-logs/123'],
    ['get', '/api/dashboard/summary'],
    ['get', '/api/dashboard/utilization'],
    ['get', '/api/dashboard/recent-activity'],
    ['get', '/api/analytics/sustainability'],
    ['get', '/api/analytics/annual-recap'],
    ['get', '/api/analytics/wear-frequency'],
    ['post', '/api/similarity/analyze'],
    ['post', '/api/similarity/check'],
    ['get', '/api/similarity/123/similar'],
    ['post', '/api/exports/resale'],
    ['post', '/api/exports/donation'],
    ['get', '/api/exports/history'],
    ['get', '/api/partners'],
    ['post', '/api/partners'],
    ['patch', '/api/partners/123'],
    ['delete', '/api/partners/123'],
    ['get', '/api/notifications/preferences'],
    ['patch', '/api/notifications/preferences'],
    ['post', '/api/notifications/test'],
    ['post', '/api/sync/push'],
    ['get', '/api/sync/pull'],
    ['post', '/api/sync/resolve-conflict'],
    ['post', '/api/extension/capture-product'],
    ['post', '/api/extension/similarity-check'],
  ])('%s %s', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.message).toBe('string');
  });
});
