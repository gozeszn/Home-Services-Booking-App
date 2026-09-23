# Member One backend handoff

## Setup

Run commands from the repository root. Use Node.js 22 or newer and npm (installed dependencies require at least Node 20.19). Use a local MongoDB server or a dedicated development Atlas database.

```powershell
npm ci
```

For a new checkout, copy `.env.example` to `.env`. Preserve any existing `.env`; add missing settings instead. Generate a JWT secret and paste the result into JWT_SECRET in `.env`:

```powershell
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

| Variable | Meaning |
| --- | --- |
| NODE_ENV | development, test, or production; defaults to development for the API |
| PORT | Integer 1-65535; default 5000 |
| MONGODB_URI | Required MongoDB connection string |
| JWT_SECRET | Required secret, at least 32 characters; replace the template placeholder |
| JWT_EXPIRES_IN | Positive duration such as 30m, 1h, or 7d; default 1h |
| CLIENT_ORIGIN | Required frontend HTTP(S) origin, no path or trailing slash |
| SEED_PASSWORD | Seed script only; 12+ characters and at most 72 UTF-8 bytes |

The root `.env` is loaded without overriding existing process environment values. Never commit real credentials. Start MongoDB, then run `npm run dev`. The HTTP server waits for the database connection before listening.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start backend with automatic restarts |
| `npm start` | Start backend normally |
| `npm test` | Run 13 existing authentication/profile API tests |
| `npm run test:watch` | Watch the existing API test suite |
| `npm run check` | Check syntax of app.js and server.js only |
| `node --test Backend/tests/seedUsers.test.js` | Run two seed safeguard tests |
| `node Backend/scripts/seedUsers.js` | Create optional development accounts |

Tests start isolated temporary MongoDB instances without using your application database. The first run may download a MongoDB binary. The API need not be running. The seed command is different: it writes to the database configured in MONGODB_URI.

## Development accounts

Set NODE_ENV explicitly to development and point MONGODB_URI at your development database. Generate a password:

```powershell
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

Paste that result into SEED_PASSWORD in `.env`, then run:

```powershell
node Backend/scripts/seedUsers.js
```

| Account | Role |
| --- | --- |
| customer@home-services.test | customer |
| provider@home-services.test | provider |
| admin@home-services.test | admin |

New accounts share your locally configured seed password and use the regular login endpoint. Passwords are hashed and are not printed. The script refuses other environment modes. Reruns preserve existing passwords, roles, and status; changing SEED_PASSWORD does not reset existing accounts. Partial runs can be rerun. A colliding existing account is never promoted to admin. These fixtures are not a production provisioning mechanism.

## API contract

Local base URL: `http://localhost:5000/api/v1`. Use JSON bodies and Content-Type: application/json. Protected requests require Authorization: Bearer <accessToken>. Maximum JSON body size: 10 KB.

| Method and path | Access | Success |
| --- | --- | --- |
| GET /health | Public | 200 with status, message, timestamp |
| POST /auth/register | Public | 201 with user and accessToken |
| POST /auth/login | Public | 200 with user and accessToken |
| GET /users/me | Active authenticated user | 200 with user |
| PATCH /users/me | Active authenticated user | 200 with updated user |

Health reports process availability, not a live database readiness check.

### Register

```json
{
  "fullName": "Demo Customer",
  "email": "customer@example.com",
  "password": "ExamplePassword123!",
  "role": "customer"
}
```

All fields are required. Name: trimmed, 2-100 characters. Email: valid address, trimmed/lowercased, maximum 254 characters. Password: minimum 8 characters, maximum 72 UTF-8 bytes; never trimmed. Public roles: customer or provider only. Unknown fields are rejected. Duplicate emails return 409 EMAIL_ALREADY_EXISTS, including simultaneous registration protected by the unique index.

### Login

```json
{
  "email": "customer@example.com",
  "password": "ExamplePassword123!"
}
```

Both fields are required. Wrong passwords and unknown emails return the same 401 INVALID_CREDENTIALS error. Correct credentials for an inactive account return 403 ACCOUNT_INACTIVE.

Registration and login return this shape; IDs, timestamps, and token below are illustrative:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "Demo Customer",
      "email": "customer@example.com",
      "role": "customer",
      "status": "active",
      "phone": null,
      "location": null,
      "createdAt": "2026-09-23T10:00:00.000Z",
      "updatedAt": "2026-09-23T10:00:00.000Z"
    },
    "accessToken": "<JWT>"
  }
}
```

### Get and update profile

GET /users/me has no request body. PATCH accepts one or more of:

```json
{
  "fullName": "Demo Customer Updated",
  "phone": "+2348012345678",
  "location": "Lagos"
}
```

Name: 2-100 characters. Phone: maximum 30. Location: maximum 200. Values are trimmed strings, not null. Phone format is not validated beyond length. Empty phone/location strings clear them; omitted fields stay unchanged. Empty updates and unknown fields (including email, password, role, status, and user ID) return 400 VALIDATION_ERROR.

Profile responses use `{ "success": true, "data": { "user": { ... } } }`, with the user fields above and no accessToken. Passwords and hashes are never returned. The target user comes from the verified token.

### Errors

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "body.fullName", "message": "Validation message" }
    ]
  }
}
```

Branch on HTTP status and error.code, not exact validation messages. details is usually empty for non-validation errors.

| HTTP | Codes |
| --- | --- |
| 400 | VALIDATION_ERROR, INVALID_JSON, INVALID_VALUE |
| 401 | INVALID_CREDENTIALS, AUTHENTICATION_REQUIRED, INVALID_TOKEN, TOKEN_EXPIRED, INVALID_SESSION |
| 403 | ACCOUNT_INACTIVE, ACCOUNT_UNAVAILABLE, FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | EMAIL_ALREADY_EXISTS, DUPLICATE_RESOURCE |
| 413 | PAYLOAD_TOO_LARGE |
| 500 | INTERNAL_ERROR |

## PowerShell example

With the API running and seeds created, enter your seed password when prompted:

```powershell
$baseUrl = 'http://localhost:5000/api/v1'
$credential = Get-Credential -UserName 'customer@home-services.test' -Message 'Development login'
$body = @{
  email = $credential.UserName
  password = $credential.GetNetworkCredential().Password
} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType 'application/json' -Body $body
$headers = @{ Authorization = "Bearer $($login.data.accessToken)" }
Invoke-RestMethod -Uri "$baseUrl/users/me" -Headers $headers
$update = @{ location = 'Lagos' } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/users/me" -Method Patch -ContentType 'application/json' -Headers $headers -Body $update
```

## Integration rules for other members

Use the existing User model and middleware. MongoDB references use User._id; API responses expose user.id. Do not duplicate authentication endpoints or user identities.

1. Run authenticate before authorize('provider') or authorize('admin'). Authentication checks JWT signature/expiry and loads the active account into req.user. Authorization uses its current database role.
2. Read checked input from req.validated.body, req.validated.params, or req.validated.query. Do not overwrite req.query in Express 5.
3. Use req.user._id for identity. Each feature must also check resource ownership; role middleware does not check ownership.
4. Throw AppError(message, statusCode, code, details) for expected failures. Express 5 forwards async controller failures to the error handler.
5. Mount routers before notFound/errorHandler in app.js. Keep listen calls in server.js.
6. Member Two owns profiles/services, Member Three bookings/payment records, Member Four reviews/admin APIs. The seeded provider is only a User account; profiles/services still need their feature implementations.

CORS currently allows GET, POST, PATCH, OPTIONS and Content-Type/Authorization for CLIENT_ORIGIN. Coordinate new HTTP methods centrally. CORS is a browser policy, not access control.

## Limitations and verification

Logout clears the client token; it does not revoke a JWT. Tokens remain valid until expiry, unless account deactivation blocks them through the database check. Refresh tokens, password reset/change, and frontend screens are not implemented. Seeded admins can log in and access their own profile; dashboard/moderation routes belong to Member Four.

The 13 API tests cover registration, login, protected profiles, inactive accounts, input validation, and CORS. Two additional seed tests cover environment guards, hashed credentials, account creation and preservation on rerun. These tests do not constitute exhaustive production security testing.

For handoff, each member should follow setup, create fixtures in their own development database, log in with the needed role, and retrieve their profile. Before deployment, review authentication rate limiting, HTTPS/secrets, production indexes, graceful shutdown, and expanded authorization/security tests.
