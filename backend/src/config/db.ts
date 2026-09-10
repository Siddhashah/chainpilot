import mongoose from 'mongoose';
import { env } from './env.js';

let connected = false;

export async function connectDB(uri: string = env.mongoUri): Promise<typeof mongoose> {
  if (connected) return mongoose;
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  connected = true;
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
