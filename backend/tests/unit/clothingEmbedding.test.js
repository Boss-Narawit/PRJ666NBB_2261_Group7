jest.mock('axios');
const axios = require('axios');
const mongoose = require('mongoose');
const Clothing = require('../../src/models/Clothing');
const { embedNewItems } = require('../../src/services/clothing.service');

describe('clothing.service embedNewItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeItem = async () => {
    return Clothing.create({
      name: 'Test Shirt',
      brand: 'TestBrand',
      category: 'tops',
      colors: ['red'],
      size: 'M',
      condition: 'Good',
      imageUrl: 'http://img.example/shirt.jpg',
      userId: new mongoose.Types.ObjectId(),
    });
  };

  it('stamps aiEmbedding on the item from the AI service response', async () => {
    axios.get.mockResolvedValue({ data: Buffer.from('fake-image') });
    axios.post.mockResolvedValue({ data: { embedding: [0.1, 0.2, 0.3] } });

    const item = await makeItem();
    await embedNewItems([item]);

    const updatedItem = await Clothing.findById(item._id);
    expect(updatedItem.aiEmbedding).toEqual([0.1, 0.2, 0.3]);
    expect(axios.get).toHaveBeenCalledWith(item.imageUrl, { responseType: 'arraybuffer' });
    expect(axios.post.mock.calls[0][0]).toBe('http://localhost:8000/api/ai/embed');
  });

  it('leaves the item untouched and does not throw when the image fetch fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error('boom'));

    const item = await makeItem();
    await expect(embedNewItems([item])).resolves.toBeUndefined();

    const updatedItem = await Clothing.findById(item._id);
    expect(updatedItem.aiEmbedding).toEqual([]);
    expect(axios.post).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('continues embedding the rest of the batch after one failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error('fail'));
    axios.get.mockResolvedValue({ data: Buffer.from('fake-image') });
    axios.post.mockResolvedValue({ data: { embedding: [0.5] } });

    const itemA = await makeItem();
    const itemB = await makeItem();
    await embedNewItems([itemA, itemB]);

    const updatedA = await Clothing.findById(itemA._id);
    const updatedB = await Clothing.findById(itemB._id);

    expect(updatedA.aiEmbedding).toEqual([]);
    expect(updatedB.aiEmbedding).toEqual([0.5]);

    consoleSpy.mockRestore();
  });
});
