const mongoose = require('mongoose');

// Connect to the in-memory replica set started in globalSetup.js.
// This deliberately bypasses src/config/db.js so production Atlas is never touched.
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

// Isolate tests: wipe every collection between tests.
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
