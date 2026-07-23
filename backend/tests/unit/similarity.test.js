jest.mock('axios');
const axios = require('axios');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const Clothing = require('../../src/models/Clothing');
const SimilarityCheck = require('../../src/models/SimilarityCheck');
const Notification = require('../../src/models/Notification');
const { runCheckForPurchase } = require('../../src/services/similarity.service');

describe('similarity.service runCheckForPurchase', () => {
  let aggregateSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    aggregateSpy = jest.spyOn(Clothing, 'aggregate');
    axios.get.mockResolvedValue({ data: Buffer.from('img') });
    axios.post.mockResolvedValue({ data: { embedding: [0.1, 0.2] } });
  });

  afterEach(() => {
    aggregateSpy.mockRestore();
  });

  const makePurchase = (overrides = {}) => ({
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    itemName: 'Cool Jacket',
    imageUrl: 'https://img.example/jacket.jpg',
    ...overrides,
  });

  it('BR6: skips entirely when the purchase has no imageUrl', async () => {
    const purchase = makePurchase({ imageUrl: undefined });
    await runCheckForPurchase(purchase);
    expect(axios.get).not.toHaveBeenCalled();
    expect(aggregateSpy).not.toHaveBeenCalled();
    expect(await SimilarityCheck.countDocuments()).toBe(0);
  });

  it('BR16: >=70% cosine match persists the check and emits a similarity_alert', async () => {
    const purchase = makePurchase();
    aggregateSpy.mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Denim Jacket',
        imageUrl: 'http://img/d.jpg',
        status: 'Available',
        score: 0.9,
      },
    ]);

    await runCheckForPurchase(purchase);

    const checks = await SimilarityCheck.find();
    expect(checks).toHaveLength(1);
    expect(checks[0].score).toBeCloseTo(0.8);
    expect(checks[0].alertSent).toBe(true);

    const notifications = await Notification.find();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('similarity_alert');
    expect(notifications[0].userId.toString()).toBe(purchase.userId.toString());
    expect(notifications[0].message).toContain('80%');
    expect(notifications[0].message).toContain('Denim Jacket');
  });

  it('BR16: below-threshold match persists the check but sends no alert', async () => {
    const purchase = makePurchase();
    aggregateSpy.mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Basic Tee',
        status: 'Available',
        score: 0.6,
      },
    ]);

    await runCheckForPurchase(purchase);

    const checks = await SimilarityCheck.find();
    expect(checks).toHaveLength(1);
    expect(checks[0].score).toBeCloseTo(0.2);
    expect(checks[0].alertSent).toBe(false);

    expect(await Notification.countDocuments()).toBe(0);
  });

  it('BR18: the same (purchase, item) pair is only recorded once', async () => {
    await SimilarityCheck.init();
    const purchase = makePurchase();
    aggregateSpy.mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Denim Jacket',
        status: 'Available',
        score: 0.9,
      },
    ]);

    await runCheckForPurchase(purchase);
    await runCheckForPurchase(purchase);

    expect(await SimilarityCheck.countDocuments()).toBe(1);
    expect(await Notification.countDocuments()).toBe(1);
  });

  it('BR19: the vector-search pipeline only accepts Available items', async () => {
    aggregateSpy.mockResolvedValue([]);
    const purchase = makePurchase();
    await runCheckForPurchase(purchase);

    const pipeline = aggregateSpy.mock.calls[0][0];
    const matchStage = pipeline.find((stage) => stage.$match);
    expect(matchStage).toBeDefined();
    expect(matchStage.$match.status).toBe('Available');
  });

  it('never throws when the AI service is down', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error('ECONNREFUSED'));
    const purchase = makePurchase();

    await expect(runCheckForPurchase(purchase)).resolves.toBeUndefined();
    expect(await SimilarityCheck.countDocuments()).toBe(0);

    consoleErrorSpy.mockRestore();
  });
});

describe('POST /api/similarity/check', () => {
  let token;
  let aggregateSpy;

  beforeEach(async () => {
    jest.clearAllMocks();
    aggregateSpy = jest.spyOn(Clothing, 'aggregate');
    axios.post.mockResolvedValue({ data: { embedding: [0.1, 0.2] } });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'similarity-check@example.com',
      password: 'Password1',
    });
    token = res.body.token;
  });

  afterEach(() => {
    aggregateSpy.mockRestore();
  });

  it('returns the best match with a true cosine score (Atlas space stays internal)', async () => {
    aggregateSpy.mockResolvedValue([
      {
        _id: new mongoose.Types.ObjectId(),
        name: 'Denim Jacket',
        imageUrl: 'http://img/d.jpg',
        status: 'Available',
        score: 0.9,
      },
    ]);

    const res = await request(app)
      .post('/api/similarity/check')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('img'), 'wishlist.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body.matchesFound).toBe(true);
    expect(res.body.match.name).toBe('Denim Jacket');
    expect(res.body.match.score).toBeCloseTo(0.8);
  });

  it('returns match: null when the wardrobe has nothing to compare', async () => {
    aggregateSpy.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/similarity/check')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('img'), 'wishlist.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.body.matchesFound).toBe(false);
    expect(res.body.match).toBeNull();
  });
});
