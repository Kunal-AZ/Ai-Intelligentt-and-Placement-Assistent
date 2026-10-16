export type UserRole = 'STUDENT' | 'ADMIN' | 'COUNSELOR';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; requestId?: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
