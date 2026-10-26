import type { UserRole } from '@placement-assistant/types';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole };
    }
  }
}

export {};
