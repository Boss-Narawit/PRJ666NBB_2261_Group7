require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');

const Clothing = require('../src/models/Clothing');

async function fetchImageBuffer(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function embedImage(imageBuffer) {
  const formData = new FormData();
  formData.append('image_file', imageBuffer, 'image.jpg');

  const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/ai/embed`, formData, {
    headers: formData.getHeaders(),
  });

  return aiResponse.data.embedding;
}

async function backfill() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const items = await Clothing.find({
    $or: [{ aiEmbedding: { $exists: false } }, { aiEmbedding: { $size: 0 } }],
  });

  console.log(`Found ${items.length} clothing item(s) missing an AI embedding`);

  let succeeded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const imageBuffer = await fetchImageBuffer(item.imageUrl);
      const embedding = await embedImage(imageBuffer);

      item.aiEmbedding = embedding;
      await item.save();

      succeeded++;
      console.log(`OK   ${item._id} (${item.name})`);
    } catch (error) {
      failed++;
      console.error(`FAIL ${item._id} (${item.name}): ${error.message}`);
    }
  }

  console.log(`Done. ${succeeded} succeeded, ${failed} failed.`);

  await mongoose.disconnect();
}

backfill().catch((error) => {
  console.error('Backfill script crashed:', error);
  process.exit(1);
});
