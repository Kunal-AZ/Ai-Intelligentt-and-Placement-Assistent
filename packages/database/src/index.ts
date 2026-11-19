import mongoose from 'mongoose';

export async function connectDatabase(uri: string, databaseName?: string): Promise<typeof mongoose> {
  return mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    dbName: databaseName,
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
