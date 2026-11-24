import { DomainError } from '../domain/errors.js';
import { newId } from '../domain/ids.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signToken } from '../lib/token.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_ROLES = new Set(['attendee', 'organizer', 'staff']);

export function createAuthService({ repository, secret, staffSignupKey = process.env.STAFF_SIGNUP_KEY, now = () => Date.now() }) {
  function issue(user) {
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { user: safeUser, token: signToken(safeUser, { secret, now }) };
  }

  return {
    async signup(input = {}) {
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
      const password = input.password;
      const role = input.role ?? 'attendee';
      if (!name || !EMAIL.test(email) || typeof password !== 'string' || password.length < 8 || !PUBLIC_ROLES.has(role) || (role === 'staff' && (!staffSignupKey || input.staffInviteCode !== staffSignupKey))) {
        throw new DomainError('VALIDATION', 'Provide a name, valid email, password of at least 8 characters, and a permitted account role');
      }
      if (await repository.findUserByEmail(email)) throw new DomainError('EMAIL_TAKEN', 'An account with this email already exists');
      const user = { id: newId(), name, email, role, passwordHash: await hashPassword(password) };
      try { await repository.insertUser(user); }
      catch (error) {
        if (String(error.message).includes('UNIQUE')) throw new DomainError('EMAIL_TAKEN', 'An account with this email already exists');
        throw error;
      }
      return issue(user);
    },

    async login(input = {}) {
      const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
      const user = await repository.findUserByEmail(email);
      const valid = await verifyPassword(input.password, user?.passwordHash);
      if (!valid) throw new DomainError('INVALID_CREDENTIALS', 'Email or password is incorrect');
      return issue(user);
    },

    async me(userId) {
      const user = await repository.findUserById(userId);
      if (!user) throw new DomainError('UNAUTHENTICATED', 'Account no longer exists');
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  };
}
