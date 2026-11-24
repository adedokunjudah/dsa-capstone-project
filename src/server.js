import { pathToFileURL } from 'node:url';
import { createAppServer } from './http/app.js';
import { Router } from './http/router.js';
import { registerApiRoutes } from './http/routes.js';
import { createMockPaymentGateway } from './lib/mockPaymentGateway.js';
import { createSqliteRepository } from './repositories/sqlite.js';
import { createBookingService } from './services/bookingService.js';
import { createEventService } from './services/eventService.js';
import { createAuthService } from './services/authService.js';
import { DATABASE_PATH, PORT } from './config.js';
const DEVELOPMENT_SECRET = 'local-development-secret-change-this-before-deployment';
export function createTicketingServer({ repository = createSqliteRepository(), paymentGateway = createMockPaymentGateway(), tokenSecret = process.env.JWT_SECRET ?? DEVELOPMENT_SECRET } = {}) {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('Set JWT_SECRET to a random value of at least 32 characters in production');
  const tokenOptions = { secret: tokenSecret };
  const eventService = createEventService({ repository });
  const bookingService = createBookingService({ repository, paymentGateway });
  const authService = createAuthService({ repository, secret: tokenSecret });
  const router = registerApiRoutes(new Router(), { eventService, bookingService, authService, tokenOptions });
  return createAppServer({ router });
}
export function startServer(port = PORT, databasePath = DATABASE_PATH) {
  const repository = createSqliteRepository({ path: databasePath });
  const server = createTicketingServer({ repository });
  server.on('close', () => repository.close());
  server.listen(port, () => { console.log(`Event ticketing server listening on port ${port}`); console.log(`Data is stored in ${databasePath}`); });
  const shutDown = () => server.close(() => process.exit(0));
  process.once('SIGINT', shutDown); process.once('SIGTERM', shutDown);
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startServer();
