const { MongoMemoryReplSet } = require('mongodb-memory-server');

// Single-node replica set so Mongoose transactions (withTransaction) work in tests.
module.exports = async () => {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  global.__MONGOD__ = replSet;
  process.env.MONGODB_URI = replSet.getUri();
};
