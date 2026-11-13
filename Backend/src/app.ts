import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { HttpLogger, Options as PinoHttpOptions } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { v1Router } from './routes/v1/index.js';

const require = createRequire(import.meta.url);
const pinoHttp = require('pino-http') as (options?: PinoHttpOptions) => HttpLogger;

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(pinoHttp({ genReqId: (request) => request.headers['x-request-id']?.toString() ?? crypto.randomUUID() }));
  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api/v1', v1Router);
  app.use(errorHandler);
  return app;
}
