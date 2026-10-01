# Home Services Booking App

The backend delivers Member One's authentication/account APIs and Member Two's provider profiles, categories, and service APIs. Booking, payment-record, review, and admin APIs remain separate work. The React feature pages currently use demo data except for authentication and account profiles.

Start with the [backend handoff guide](docs/backend-handoff.md) for setup, environment variables, development seed accounts, API request/response examples, and integration instructions.

- [Environment template](.env.example)
- [Backend structure](Backend/STRUCTURE.md)
- [MVP requirements and team ownership](docs/requirements.md)
- [Member Two API contract and integration notes](docs/member-two-api.md)

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

The tests use temporary databases; a first run may download a MongoDB binary. `npm test` runs all backend suites, including authentication, provider/service API regression tests, and both seed safeguards. `npm run check` checks backend JavaScript syntax and exact local-import casing.

## Optional development fixtures

Set NODE_ENV=development and SEED_PASSWORD in your local `.env` (at least 12 characters, at most 72 UTF-8 bytes), then run:

```powershell
node Backend/scripts/seedUsers.js
```

This creates customer, provider, and admin accounts in your configured development database. Existing records are preserved. See the handoff guide for account addresses and details. Never commit `.env` or credentials.

For service creation, seed the development categories as well:

```powershell
npm run seed:categories
```

This preserves existing categories and requires `NODE_ENV=development`. Then complete the provider profile, create an inactive service, and explicitly activate it. See the Member Two contract for request bodies, IDs, and pagination.
