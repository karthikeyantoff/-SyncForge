import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  const uri = env.mongoUri;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${err.message}`);
    if (env.nodeEnv === 'production') {
      process.exit(1);
    }
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
