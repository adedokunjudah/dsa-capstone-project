const copy = (record) => (record === undefined ? undefined : structuredClone(record));
export function createMemoryRepository() {
  const events = new Map(); const tiers = new Map(); const bookings = new Map(); const users = new Map();
  return {
    async insertUser(user) { users.set(user.id, copy(user)); return copy(user); },
    async findUserByEmail(email) { return copy([...users.values()].find((u) => u.email === email)); },
    async findUserById(id) { return copy(users.get(id)); },
    async insertEvent(event) { events.set(event.id, copy(event)); return copy(event); },
    async findEvent(id) { return copy(events.get(id)); },
    async updateEvent(event) { events.set(event.id, copy(event)); return copy(event); },
    async listEvents() { return [...events.values()].map(copy); },
    async insertTier(tier) { tiers.set(tier.id, copy(tier)); return copy(tier); },
    async findTier(id) { return copy(tiers.get(id)); },
    async updateTier(tier) { tiers.set(tier.id, copy(tier)); return copy(tier); },
    async listTiersForEvent(eventId) { return [...tiers.values()].filter((t) => t.eventId === eventId).map(copy); },
    async reserveSeats(tierId, quantity) { const tier = tiers.get(tierId); if (!tier || tier.sold + quantity > tier.capacity) return false; tier.sold += quantity; return true; },
    async releaseSeats(tierId, quantity) { const tier = tiers.get(tierId); if (!tier || tier.sold < quantity) return false; tier.sold -= quantity; return true; },
    async insertBooking(booking) { bookings.set(booking.reference, copy(booking)); return copy(booking); },
    async findBookingByReference(reference) { return copy(bookings.get(reference)); },
    async listBookingsForUser(userId) { return [...bookings.values()].filter((b) => b.userId === userId).map(copy); },
    async updateBooking(booking) { bookings.set(booking.reference, copy(booking)); return copy(booking); },
    close() {},
  };
}
