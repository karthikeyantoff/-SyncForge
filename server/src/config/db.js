import mongoose from 'mongoose';
import { env } from './env.js';

let cachedConnection = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = env.mongoUri;
  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Database] MongoDB Atlas Connected: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (err) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
    cachedConnection = null;
    throw err;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cachedConnection = null;
  }
}
