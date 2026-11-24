import { openDatabase } from '../db/connection.js';
const withoutNulls = (record) => Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== undefined));
const toUser = (r) => r && ({ id:r.id, name:r.name, email:r.email, role:r.role, passwordHash:r.password_hash });
const toEvent = (r) => r && ({ id:r.id, organizerId:r.organizer_id, title:r.title, city:r.city, venue:r.venue, startsAt:r.starts_at, status:r.status });
const toTier = (r) => r && ({ id:r.id, eventId:r.event_id, name:r.name, priceCents:r.price_cents, capacity:r.capacity, sold:r.sold });
const toBooking = (r) => r && withoutNulls({ id:r.id, reference:r.reference, userId:r.user_id, eventId:r.event_id, tierId:r.tier_id, quantity:r.quantity, amountCents:r.amount_cents, status:r.status, chargeId:r.charge_id, createdAt:r.created_at, paidAt:r.paid_at, cancelledAt:r.cancelled_at, holdUntil:r.hold_until });

export function createSqliteRepository({ path, db = openDatabase(path) } = {}) {
  const columns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
  if (!columns.includes('password_hash')) db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  const bookingColumns = db.prepare('PRAGMA table_info(bookings)').all().map((column) => column.name);
  if (!bookingColumns.includes('hold_until')) db.exec('ALTER TABLE bookings ADD COLUMN hold_until TEXT');
  const sql = {
    ensureUser: db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)'),
    insertUser: db.prepare('INSERT INTO users (id,name,email,role,password_hash) VALUES (?,?,?,?,?)'),
    findUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertEvent: db.prepare('INSERT INTO events (id,organizer_id,title,city,venue,starts_at,status) VALUES (?,?,?,?,?,?,?)'),
    findEvent: db.prepare('SELECT * FROM events WHERE id = ?'),
    updateEvent: db.prepare('UPDATE events SET title=?,city=?,venue=?,starts_at=?,status=? WHERE id=?'),
    listEvents: db.prepare('SELECT * FROM events ORDER BY rowid'),
    insertTier: db.prepare('INSERT INTO ticket_tiers (id,event_id,name,price_cents,capacity,sold) VALUES (?,?,?,?,?,?)'),
    findTier: db.prepare('SELECT * FROM ticket_tiers WHERE id = ?'),
    updateTier: db.prepare('UPDATE ticket_tiers SET name=?,price_cents=?,capacity=?,sold=? WHERE id=?'),
    listTiersForEvent: db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ? ORDER BY rowid'),
    reserveSeats: db.prepare('UPDATE ticket_tiers SET sold=sold+? WHERE id=? AND sold+?<=capacity'),
    releaseSeats: db.prepare('UPDATE ticket_tiers SET sold=sold-? WHERE id=? AND sold>=?'),
    insertBooking: db.prepare(`INSERT INTO bookings (id,reference,user_id,event_id,tier_id,quantity,amount_cents,status,charge_id,created_at,paid_at,cancelled_at,hold_until) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`),
    findBooking: db.prepare('SELECT * FROM bookings WHERE reference = ?'),
    listBookingsForUser: db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC'),
    updateBooking: db.prepare('UPDATE bookings SET status=?,charge_id=?,paid_at=?,cancelled_at=? WHERE reference=?'),
  };
  const findEvent = (id) => toEvent(sql.findEvent.get(id)); const findTier = (id) => toTier(sql.findTier.get(id)); const findBooking = (ref) => toBooking(sql.findBooking.get(ref));
  return {
    async insertUser(u) { sql.insertUser.run(u.id,u.name,u.email,u.role,u.passwordHash); return toUser(sql.findUserById.get(u.id)); },
    async findUserByEmail(email) { return toUser(sql.findUserByEmail.get(email)); },
    async findUserById(id) { return toUser(sql.findUserById.get(id)); },
    async insertEvent(e) { sql.ensureUser.run(e.organizerId); sql.insertEvent.run(e.id,e.organizerId,e.title,e.city,e.venue,e.startsAt,e.status); return findEvent(e.id); },
    async findEvent(id) { return findEvent(id); },
    async updateEvent(e) { sql.updateEvent.run(e.title,e.city,e.venue,e.startsAt,e.status,e.id); return findEvent(e.id); },
    async listEvents() { return sql.listEvents.all().map(toEvent); },
    async insertTier(t) { sql.insertTier.run(t.id,t.eventId,t.name,t.priceCents,t.capacity,t.sold); return findTier(t.id); },
    async findTier(id) { return findTier(id); },
    async updateTier(t) { sql.updateTier.run(t.name,t.priceCents,t.capacity,t.sold,t.id); return findTier(t.id); },
    async listTiersForEvent(id) { return sql.listTiersForEvent.all(id).map(toTier); },
    async reserveSeats(id,n) { return sql.reserveSeats.run(n,id,n).changes === 1; },
    async releaseSeats(id,n) { return sql.releaseSeats.run(n,id,n).changes === 1; },
    async insertBooking(b) { sql.ensureUser.run(b.userId); sql.insertBooking.run(b.id,b.reference,b.userId,b.eventId,b.tierId,b.quantity,b.amountCents,b.status,b.chargeId??null,b.createdAt,b.paidAt??null,b.cancelledAt??null,b.holdUntil??null); return findBooking(b.reference); },
    async findBookingByReference(ref) { return findBooking(ref); },
    async listBookingsForUser(id) { return sql.listBookingsForUser.all(id).map(toBooking); },
    async updateBooking(b) { sql.updateBooking.run(b.status,b.chargeId??null,b.paidAt??null,b.cancelledAt??null,b.reference); return findBooking(b.reference); },
    close() { if (db.isOpen) db.close(); },
  };
}
