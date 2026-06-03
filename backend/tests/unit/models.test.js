const mongoose = require('mongoose');
const Clothing = require('../../src/models/Clothing');

const validClothing = () => ({
  userId: new mongoose.Types.ObjectId(),
  name: 'Blue Tee',
  brand: 'Uniqlo',
  category: 'tops',
  colors: ['blue'],
  size: 'M',
  imageUrl: 'https://example.com/tee.png',
  condition: 'Good',
});

describe('Clothing schema validation (BR4 / BR7)', () => {
  test('a complete document validates', async () => {
    await expect(new Clothing(validClothing()).validate()).resolves.toBeUndefined();
  });

  test('missing required fields throws ValidationError', async () => {
    const doc = new Clothing({ name: 'only name' });
    await expect(doc.validate()).rejects.toMatchObject({ name: 'ValidationError' });
  });

  test('invalid category enum is rejected', async () => {
    const doc = new Clothing({ ...validClothing(), category: 'spacesuit' });
    await expect(doc.validate()).rejects.toMatchObject({ name: 'ValidationError' });
  });

  test('invalid condition enum is rejected (BR7)', async () => {
    const doc = new Clothing({ ...validClothing(), condition: 'Pristine' });
    await expect(doc.validate()).rejects.toMatchObject({ name: 'ValidationError' });
  });
});
