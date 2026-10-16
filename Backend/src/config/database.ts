import { connectDatabase, disconnectDatabase } from '@placement-assistant/database';
import { env } from './env.js';

export const connectToDatabase = () => connectDatabase(env.MONGODB_URI);
export const disconnectFromDatabase = () => disconnectDatabase();
