const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Requires a replica set or Atlas — standalone mongod will throw on startTransaction.
// Delegates to the driver's withTransaction so transient errors (e.g. a
// WriteConflict when two concurrent transactions write the same document) retry
// the callback against fresh state instead of surfacing as a 500 — a losing
// double-submit re-reads the new state and fails with the service's own error.
// Non-transient errors (thrown `.status` errors, validation) are not retried.
const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => callback(session));
  } finally {
    session.endSession();
  }
};

module.exports = { connectDB, withTransaction };
