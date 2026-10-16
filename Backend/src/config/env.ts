import 'dotenv/config';
import { parseEnvironment } from '@placement-assistant/config';

export const env = parseEnvironment(process.env);
