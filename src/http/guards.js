import { DomainError } from '../domain/errors.js';
import { verifyToken } from '../lib/token.js';

export function requireUser(request, options = {}) {
  const value = request.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(value);
  if (!match) throw new DomainError('UNAUTHENTICATED', 'A valid bearer token is required');
  return verifyToken(match[1], options);
}

export function optionalUser(request, options = {}) {
  if (!request.headers.authorization) return null;
  return requireUser(request, options);
}

export function requireRole(user, ...roles) {
  if (!user) throw new DomainError('UNAUTHENTICATED', 'A valid bearer token is required');
  if (!roles.includes(user.role)) throw new DomainError('FORBIDDEN', 'Your account role cannot perform this action');
  return user;
}
