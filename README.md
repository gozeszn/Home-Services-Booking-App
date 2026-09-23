# Home Services Booking App

Member One's backend delivers registration, login, JWT authentication, current-user profile access and updates, role middleware, validation, and shared errors. The other members' feature APIs and the React frontend are separate work.

Start with the [backend handoff guide](docs/backend-handoff.md) for setup, environment variables, development seed accounts, API request/response examples, and integration instructions.

- [Environment template](.env.example)
- [Backend structure](Backend/STRUCTURE.md)
- [MVP requirements and team ownership](docs/requirements.md)

## Quick start

Use Node.js 22 or newer, npm, and a local MongoDB server or a development Atlas database. From the repository root:

```powershell
npm ci
```

On a fresh checkout, copy `.env.example` to `.env`. Preserve existing configuration if `.env` already exists. Generate a secret and paste it into JWT_SECRET in `.env`:

```powershell
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Set MONGODB_URI and CLIENT_ORIGIN, then start the backend:

```powershell
npm run dev
```

Health URL: `http://localhost:5000/api/v1/health`.

## Verification

```powershell
npm run check
npm test
node --test Backend/tests/seedUsers.test.js
```

The tests use temporary databases; a first run may download a MongoDB binary. The existing npm test command runs 13 API tests; the separate seed command runs two safeguard tests.

## Optional development fixtures

Set NODE_ENV=development and SEED_PASSWORD in your local `.env` (at least 12 characters, at most 72 UTF-8 bytes), then run:

```powershell
node Backend/scripts/seedUsers.js
```

This creates customer, provider, and admin accounts in your configured development database. Existing records are preserved. See the handoff guide for account addresses and details. Never commit `.env` or credentials.
