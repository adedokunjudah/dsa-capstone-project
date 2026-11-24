import { getToken, clearSession } from './session.js';
async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken(); if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try { response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw Object.assign(new Error('Network error. Check your connection and try again.'), { code: 'NETWORK_ERROR' }); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error ?? {};
    if (response.status === 401) clearSession();
    throw Object.assign(new Error(detail.message || `Request failed (${response.status})`), { status: response.status, code: detail.code || 'REQUEST_FAILED' });
  }
  return data;
}
export const signup = (input) => request('/api/auth/signup', { method: 'POST', body: input });
export const login = (input) => request('/api/auth/login', { method: 'POST', body: input });
export const me = () => request('/api/auth/me');
export const listEvents = (filters = {}) => { const query = new URLSearchParams(); for (const [key,value] of Object.entries(filters)) if (value !== undefined && value !== '' && value !== false) query.set(key,String(value)); return request(`/api/events?${query}`); };
export const getEvent = async (id) => request(`/api/events/${encodeURIComponent(id)}`);
export const createBooking = (input) => request('/api/bookings', { method:'POST', body:input });
export const pay = (reference, paymentToken) => request(`/api/bookings/${encodeURIComponent(reference)}/pay`, { method:'POST', body:{paymentToken} });
export const cancelBooking = (reference) => request(`/api/bookings/${encodeURIComponent(reference)}/cancel`, { method:'POST' });
export const listMyBookings = () => request('/api/bookings');
export const createEvent = (input) => request('/api/events', { method:'POST', body:input });
export const addTier = (eventId,input) => request(`/api/events/${encodeURIComponent(eventId)}/tiers`, { method:'POST', body:input });
export const publishEvent = (eventId) => request(`/api/events/${encodeURIComponent(eventId)}/publish`, { method:'POST' });
export const unpublishEvent = (eventId) => request(`/api/events/${encodeURIComponent(eventId)}/unpublish`, { method:'POST' });
