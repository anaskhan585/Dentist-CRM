import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDatabase(uri = env.mongoUri) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 20,
    });
    const { host, name } = mongoose.connection;
    console.log(`[db] connected → ${host}/${name}`);
    return mongoose.connection;
  } catch (error) {
    console.error('[db] connection failed:', error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}
