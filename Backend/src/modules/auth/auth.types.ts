import type { UserRole } from '@placement-assistant/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
