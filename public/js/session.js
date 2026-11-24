const TOKEN_KEY = 'ticketing_access_token';
const USER_KEY = 'ticketing_user';
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } }
export function saveSession({ token, user }) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
export function requireLogin(returnTo = location.pathname + location.search) {
  if (!getToken()) { location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`; return false; }
  return true;
}
export function renderNavigation() {
  const user = getUser(); const nav = document.querySelector('[data-session-nav]');
  if (!nav) return;
  nav.replaceChildren();
  const add = (label, href) => { const a = document.createElement('a'); a.href = href; a.textContent = label; nav.append(a); };
  if (user?.role === 'organizer') add('Organizer dashboard', '/organizer');
  if (user?.role === 'attendee') add('My tickets', '/tickets');
  if (user) { const button=document.createElement('button'); button.type='button'; button.textContent=`Sign out (${user.name})`; button.addEventListener('click',()=>{clearSession();location.href='/';}); nav.append(button); }
  else add('Log in', '/login');
}
renderNavigation();
