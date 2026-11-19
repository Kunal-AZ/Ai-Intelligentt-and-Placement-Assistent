import { connectDatabase, disconnectDatabase } from '@placement-assistant/database';
import { env } from './env.js';

export const connectToDatabase = () => connectDatabase(env.MONGODB_URI, env.MONGODB_DATABASE);
export const disconnectFromDatabase = () => disconnectDatabase();
