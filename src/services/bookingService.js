import { assertTransition } from '../domain/bookingStateMachine.js';
import { DomainError } from '../domain/errors.js';
import { newId, referenceCode } from '../domain/ids.js';
import { requireQuantity, requireText, soldOutError } from '../domain/validation.js';
import { requireActor } from './eventService.js';
function toPublicBooking(booking) { const { id, userId, chargeId, ...visible } = booking; return visible; }
export function createBookingService({ repository, paymentGateway, now = () => new Date() }) {
  async function getOwnBooking(actorId, reference) {
    const booking=await repository.findBookingByReference(String(reference).toUpperCase());
    // Return 404 for another user's reference to avoid revealing its existence.
    if(!booking || booking.userId!==actorId) throw new DomainError('NOT_FOUND','Booking not found');
    return booking;
  }
  async function uniqueReference() { let reference; do { reference=referenceCode(); } while(await repository.findBookingByReference(reference)); return reference; }
  return {
    async book(actorId,input) {
      const userId=requireActor(actorId);
      if(input===null||typeof input!=='object'||Array.isArray(input)) throw new DomainError('VALIDATION','Request body must be a JSON object');
      const {tierId,quantity}=input; requireText(tierId,'tierId'); requireQuantity(quantity);
      const tier=await repository.findTier(tierId); if(!tier) throw new DomainError('NOT_FOUND','Ticket tier not found');
      const event=await repository.findEvent(tier.eventId); if(!event||event.status!=='published') throw new DomainError('INVALID_STATE','This event is not open for booking');
      if(!(await repository.reserveSeats(tierId,quantity))) throw soldOutError((await repository.findTier(tierId))??tier);
      const booking={id:newId(),reference:await uniqueReference(),userId,eventId:event.id,tierId,quantity,amountCents:tier.priceCents*quantity,status:'pending',createdAt:now().toISOString(),holdUntil:new Date(now().getTime()+10*60*1000).toISOString()};
      try { return toPublicBooking(await repository.insertBooking(booking)); } catch(error) { await repository.releaseSeats(tierId,quantity); throw error; }
    },
    async getBooking(actorId,reference) { return toPublicBooking(await getOwnBooking(requireActor(actorId),reference)); },
    async listMine(actorId) { return (await repository.listBookingsForUser(requireActor(actorId))).map(toPublicBooking); },
    async pay(actorId,reference,input) {
      const booking=await getOwnBooking(requireActor(actorId),reference); assertTransition(booking.status,'paid');
      const paymentToken=requireText(input?.paymentToken,'paymentToken');
      const charge=await paymentGateway.charge({amountCents:booking.amountCents,paymentToken,idempotencyKey:booking.reference});
      if(charge.status!=='succeeded') throw new DomainError('PAYMENT_DECLINED','The card was declined. Try another card.');
      return toPublicBooking(await repository.updateBooking({...booking,status:'paid',chargeId:charge.chargeId,paidAt:now().toISOString()}));
    },
    async cancel(actorId,reference) {
      const booking=await getOwnBooking(requireActor(actorId),reference); assertTransition(booking.status,'cancelled');
      if(booking.status!=='pending') throw new DomainError('INVALID_STATE','Only unpaid bookings can be cancelled for now');
      await repository.releaseSeats(booking.tierId,booking.quantity);
      return toPublicBooking(await repository.updateBooking({...booking,status:'cancelled',cancelledAt:now().toISOString()}));
    },
  };
}
