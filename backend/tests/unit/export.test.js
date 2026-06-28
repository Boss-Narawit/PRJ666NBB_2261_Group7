const request = require('supertest');
const app = require('../../src/app');
const { Clothing, Partner, Export } = require('../../src/models');

describe('Export API (/api/exports)', () => {
  let token;
  let userId;
  let resalePartner;
  let donationPartner;
  let inactivePartner;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1!',
    });
    token = res.body.token;
    userId = res.body._id;

    [resalePartner, donationPartner, inactivePartner] = await Partner.create([
      { name: 'Resale Co', type: 'resale', isActive: true },
      { name: 'Donate Co', type: 'donation', isActive: true },
      { name: 'Gone Co', type: 'resale', isActive: false },
    ]);
  });

  const makeItem = (overrides = {}) =>
    Clothing.create({
      userId,
      name: 'Jacket',
      brand: 'Brand',
      category: 'outerwear',
      colors: ['blue'],
      size: 'M',
      imageUrl: 'http://x.com/a.jpg',
      condition: 'Good',
      ...overrides,
    });

  const validBody = (item, overrides = {}) => ({
    clothingId: item._id,
    partnerId: resalePartner._id,
    checklistCompleted: true,
    consent: true,
    selectedFields: ['name', 'brand'],
    price: 20,
    ...overrides,
  });

  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/exports/resale').send({});
    expect(res.statusCode).toBe(401);
  });

  test('creates a resale export and archives the item (BR22)', async () => {
    const item = await makeItem();
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item));

    expect(res.statusCode).toBe(201);
    expect(res.body.type).toBe('resale');
    expect(res.body.selectedFields).toEqual(['name', 'brand']);

    const refreshed = await Clothing.findById(item._id);
    expect(refreshed.status).toBe('Archived');
  });

  test('rejects when checklist not completed (BR20)', async () => {
    const item = await makeItem();
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item, { checklistCompleted: false }));

    expect(res.statusCode).toBe(422);
    expect(await Export.countDocuments()).toBe(0);
  });

  test('rejects when consent missing (BR17)', async () => {
    const item = await makeItem();
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item, { consent: false }));

    expect(res.statusCode).toBe(422);
  });

  test('blocks damaged items from resale partners (BR21)', async () => {
    const item = await makeItem({ condition: 'Damaged' });
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item));

    expect(res.statusCode).toBe(422);
    // ...but the same damaged item can be donated
    const ok = await request(app)
      .post('/api/exports/donation')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item, { partnerId: donationPartner._id }));
    expect(ok.statusCode).toBe(201);
  });

  test('hides deactivated partners (BR30)', async () => {
    const item = await makeItem();
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item, { partnerId: inactivePartner._id }));

    expect(res.statusCode).toBe(404);
  });

  test('rejects exporting an item that is not Available', async () => {
    const item = await makeItem({ status: 'Archived' });
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item));

    expect(res.statusCode).toBe(422);
    expect(await Export.countDocuments()).toBe(0);
  });

  test('rejects a partner that does not accept the export type', async () => {
    const item = await makeItem();
    // resale endpoint, but pointed at a donation partner
    const res = await request(app)
      .post('/api/exports/resale')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item, { partnerId: donationPartner._id }));

    expect(res.statusCode).toBe(422);
    expect(await Export.countDocuments()).toBe(0);
  });

  test('lists export history for the user', async () => {
    const item = await makeItem();
    await request(app)
      .post('/api/exports/donation')
      .set('Authorization', `Bearer ${token}`)
      .send(validBody(item, { partnerId: donationPartner._id }));

    const res = await request(app)
      .get('/api/exports/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].clothingId.name).toBe('Jacket');
  });
});
