import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from '@jest/globals';

let mongo = null;

beforeAll(async () => {
  // Use Atlas test DB if available for ultra-fast and real replica-set execution
  const testUri = process.env.TEST_MONGO_URI || 'mongodb+srv://karthikeyantoff_db_user:yuKGJ6diIHTU90pr@cluster0.zibm66x.mongodb.net/SyncForge_test_db?retryWrites=true&w=majority';
  
  try {
    await mongoose.connect(testUri);
    console.log('[Test Setup] Connected to MongoDB Atlas test database.');
  } catch (err) {
    console.log('[Test Setup] Atlas connection skipped, starting MongoMemoryServer...', err.message);
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
    await mongoose.disconnect();
  }
  if (mongo) {
    await mongo.stop();
  }
});
