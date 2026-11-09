import 'server-only';
import type { ApiError } from '@lawprep/contracts';
export class ServiceError extends Error {
  constructor(readonly code: ApiError['code'], message: string, readonly status: number) { super(message); }
}
export function databaseError(error: { code?: string; message?: string }): never {
  if (error.code === '28000') throw new ServiceError('UNAUTHENTICATED', 'Please sign in again.', 401);
  if (error.code === '42501') throw new ServiceError('FORBIDDEN', 'This action is not available to your account.', 403);
  if (['23505', '40001', 'PT409'].includes(error.code ?? '')) throw new ServiceError('CONFLICT', 'This record changed. Refresh and try again.', 409);
  if (['22023', '23514', '23503', 'P0002', '55000'].includes(error.code ?? '')) throw new ServiceError('INVALID_INPUT', 'Check the content, sources and review requirements.', 400);
  if (error.code === 'P0001' && error.message === 'RATE_LIMITED') throw new ServiceError('QUOTA_EXHAUSTED', 'Too many requests. Please try again shortly.', 429);
  throw new ServiceError('UNAVAILABLE', 'The service is temporarily unavailable. Please try again.', 503);
}
