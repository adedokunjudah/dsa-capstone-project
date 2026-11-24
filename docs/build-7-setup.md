# Build 7 implementation and setup

## Apply the files

Copy the folders in this Build 7 package into the root of your existing repository and allow the listed files to be replaced. Keep all files from earlier builds that are not included here.

## Configure the signing secret

Before running the server in production, set `JWT_SECRET` to a random secret of at least 32 characters. If you need to provision staff accounts, also set a separate `STAFF_SIGNUP_KEY` and share it only with trusted staff. Example (PowerShell):

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
npm start
```

For local development, the server has a clearly marked development-only fallback secret. Do not deploy with it. Existing SQLite databases are upgraded on first start by adding `users.password_hash` and `bookings.hold_until`; existing event and booking rows are preserved.

## Run checks

```bash
npm test
npm start
```

Open `http://localhost:3000`. Create an organizer account at `/login`, create an event and a ticket tier in `/organizer`, then publish it. Create an attendee account, open the event, book a ticket and use the mock successful payment option. `/tickets` lists the signed-in attendee's bookings.

## Security notes and scope

- Passwords are stored as salted scrypt hashes; the raw password is never stored or returned.
- JWTs use HS256, expire after 24 hours, and reject other algorithms or invalid signatures.
- The API derives identity from `Authorization: Bearer ...`; it does not trust `x-user-id`.
- Public signup permits attendee and organizer roles. A staff account can be created only when the server has a `STAFF_SIGNUP_KEY` configured and the signup request includes the matching `staffInviteCode`; never expose that key in the public browser UI. This prevents visitors from granting themselves staff privileges.
- Build 7's supplied user stories cover organizer and attendee screens. Staff check-in/assigned-event workflows are not part of the supplied Build 7 acceptance criteria and remain a follow-on feature.
- The browser keeps the access token in localStorage for this plain-JavaScript learning project. For a production deployment, prefer secure, HttpOnly, SameSite cookies and add CSRF protection, rate limiting, email verification, password reset and login throttling.
- A pending booking hold is represented with a ten-minute `holdUntil` timestamp for the existing checkout countdown. Expiring and automatically releasing holds transactionally should be hardened as a later build.
