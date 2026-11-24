import { createHmac, timingSafeEqual } from 'node:crypto';
import { DomainError } from '../domain/errors.js';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));

function secretValue(secret = process.env.JWT_SECRET) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('JWT_SECRET must be set to a random secret of at least 32 characters');
  return secret;
}

export function signToken(user, { secret, now = () => Date.now(), expiresInSeconds = 60 * 60 * 24 } = {}) {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: user.id, email: user.email, role: user.role, iat: Math.floor(now() / 1000), exp: Math.floor(now() / 1000) + expiresInSeconds });
  const input = `${header}.${payload}`;
  const signature = createHmac('sha256', secretValue(secret)).update(input).digest('base64url');
  return `${input}.${signature}`;
}

export function verifyToken(token, { secret, now = () => Date.now() } = {}) {
  try {
    if (typeof token !== 'string') throw new Error('Missing token');
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = decode(headerPart);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') throw new Error('Unsupported token algorithm');
    const expected = createHmac('sha256', secretValue(secret)).update(`${headerPart}.${payloadPart}`).digest();
    const actual = Buffer.from(signaturePart, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid signature');
    const payload = decode(payloadPart);
    const seconds = Math.floor(now() / 1000);
    if (!payload.sub || !payload.role || !Number.isFinite(payload.exp) || payload.exp <= seconds) throw new Error('Expired or invalid token');
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    throw new DomainError('UNAUTHENTICATED', 'A valid bearer token is required');
  }
}
