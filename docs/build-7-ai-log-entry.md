## Build 7

### Prompt 1: Login, roles and connected frontend
- **What I asked:** Implement signup/login, scrypt password hashing, signed expiring HS256 tokens, bearer-token authorization, organizer/attendee role checks, private bookings, and real API-backed browser pages.
- **What came back:** Added auth services and crypto helpers, bearer guards, SQLite user/password/hold migrations, attendee booking listing, real fetch API client, login/signup, attendee tickets and organizer dashboard pages, and authentication/authorization tests.
- **What was wrong (or "nothing"):** The previous API used a caller-controlled `x-user-id` header and mock browser data; both had to be removed. Public signup intentionally excludes the staff role so visitors cannot grant themselves staff privileges. Staff check-in is not in the supplied Build 7 acceptance criteria.
