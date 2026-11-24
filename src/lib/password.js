import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) throw new TypeError('Password must contain at least 8 characters');
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, { N: COST, r: BLOCK_SIZE, p: PARALLELIZATION });
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false;
  const [algorithm, n, r, p, saltText, hashText, extra] = encoded.split('$');
  if (algorithm !== 'scrypt' || extra !== undefined || !saltText || !hashText) return false;
  const N = Number(n); const blockSize = Number(r); const parallelization = Number(p);
  if (![N, blockSize, parallelization].every(Number.isSafeInteger) || N < 2 || blockSize < 1 || parallelization < 1) return false;
  try {
    const expected = Buffer.from(hashText, 'base64url');
    const actual = await scrypt(password, Buffer.from(saltText, 'base64url'), expected.length, { N, r: blockSize, p: parallelization });
    return expected.length > 0 && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
