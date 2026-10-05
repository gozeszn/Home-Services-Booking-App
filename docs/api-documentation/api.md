 # Home Services Booking App — API Documentation

## 1. Overview

The Home Services Booking App exposes a REST API for authentication, user profiles, provider profiles, service discovery, bookings, payments, reviews, and review moderation.

### Base URL

```text
http://localhost:5000/api/v1
```

All request bodies should use:

```http
Content-Type: application/json
```

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

The backend accepts JSON request bodies up to 10 KB.

---

# 2. Authentication

Authentication uses JWT access tokens.

A user must authenticate before accessing protected endpoints. Role-based authorization is applied where required.

Available public registration roles:

* `customer`
* `provider`

The `admin` role is not available through public registration.

### Authentication flow

1. Register or use an existing account.
2. Log in to receive an access token.
3. Send the token using the `Authorization` header.
4. Protected routes authenticate the token and load the active user.
5. Role-protected routes additionally verify the user's current database role.

---

# 3. Health Check

## GET `/health`

Checks whether the API process is available.

### Access

Public.

### Response

**200 OK**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Home Services API is running",
    "timestamp": "2026-09-23T10:00:00.000Z"
  }
}
```

> The health endpoint reports process availability. It is not a live database-readiness check.

---

# 4. Authentication API

## POST `/auth/register`

Creates a new customer or provider account.

### Access

Public.

### Request body

```json
{
  "fullName": "Demo Customer",
  "email": "customer@example.com",
  "password": "ExamplePassword123!",
  "role": "customer"
}
```

### Fields

| Field      | Type   | Required | Rules                                        |
| ---------- | ------ | -------: | -------------------------------------------- |
| `fullName` | string |      Yes | 2–100 characters                             |
| `email`    | string |      Yes | Valid email, lowercased, max 254 characters  |
| `password` | string |      Yes | Minimum 8 characters, maximum 72 UTF-8 bytes |
| `role`     | string |      Yes | `customer` or `provider`                     |

Unknown fields are rejected.

### Success

**201 Created**

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

### Common errors

* `400 VALIDATION_ERROR`
* `409 EMAIL_ALREADY_EXISTS`

---

## POST `/auth/login`

Authenticates an existing user.

### Access

Public.

### Request body

```json
{
  "email": "customer@example.com",
  "password": "ExamplePassword123!"
}
```

Both fields are required.

### Success

**200 OK**

Returns the authenticated user and access token.

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

### Common errors

* `400 VALIDATION_ERROR`
* `401 INVALID_CREDENTIALS`
* `403 ACCOUNT_INACTIVE`

Unknown emails and incorrect passwords return the same `INVALID_CREDENTIALS` response.

---

# 5. User Profile API

All user profile routes require authentication.

## GET `/users/me`

Returns the currently authenticated user's profile.

### Access

Authenticated active user.

### Response

**200 OK**

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
    }
  }
}
```

Passwords and password hashes are never returned.

---

## PATCH `/users/me`

Updates the authenticated user's profile.

### Access

Authenticated active user.

### Request body

At least one field must be supplied.

```json
{
  "fullName": "Updated Name",
  "phone": "+2348012345678",
  "location": "Lagos"
}
```

### Fields

| Field      | Rules                            |
| ---------- | -------------------------------- |
| `fullName` | Optional, 2–100 characters       |
| `phone`    | Optional, maximum 30 characters  |
| `location` | Optional, maximum 200 characters |

Values are trimmed.

Phone formatting is not validated beyond its length.

Empty `phone` or `location` values can be used to clear those fields.

The following cannot be changed through this endpoint:

* email
* password
* role
* status
* user ID

### Success

**200 OK**

```json
{
  "success": true,
  "data": {
    "user": {}
  }
}
```

---

# 6. Categories API

## GET `/categories`

Returns available service categories.

### Access

Public.

### Query parameters

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------: | ---------------------------------------- |
| `q`       | string |       No | Literal case-insensitive category search |

Unknown query parameters are rejected.

### Example

```text
GET /categories?q=clean
```

### Success

**200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Cleaning"
    }
  ]
}
```

---

# 7. Provider API

## GET `/providers/me`

Returns the authenticated provider's own provider profile.

### Access

Authenticated user with the `provider` role.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

If the provider has not completed onboarding, the response data may be `null`.

---

## PATCH `/providers/me`

Creates or updates the authenticated provider's profile.

### Access

Authenticated user with the `provider` role.

### First onboarding request

The first profile submission requires all five fields.

```json
{
  "displayName": "Fresh Space Cleaning",
  "description": "Residential cleaning and maintenance services.",
  "phone": "08012345678",
  "serviceArea": "Lagos",
  "availabilitySummary": "Weekdays 9am to 5pm"
}
```

### Fields

| Field                 | Rules              |
| --------------------- | ------------------ |
| `displayName`         | 2–100 characters   |
| `description`         | 20–1500 characters |
| `phone`               | 7–30 characters    |
| `serviceArea`         | 2–200 characters   |
| `availabilitySummary` | 5–300 characters   |

For subsequent updates, any non-empty subset may be supplied.

Unknown fields and empty updates are rejected.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

## GET `/providers/me/services`

Returns services belonging to the authenticated provider.

### Access

Authenticated provider.

### Query parameters

| Parameter | Type                     | Default |
| --------- | ------------------------ | ------: |
| `status`  | `active` or `inactive`   |       — |
| `page`    | positive integer         |     `1` |
| `limit`   | positive integer, max 50 |    `10` |

### Success

**200 OK**

```json
{
  "success": true,
  "data": {
    "services": [],
    "meta": {}
  },
  "meta": {}
}
```

---

## GET `/providers/:providerId`

Returns a public provider profile and its active services.

### Access

Public.

### Path parameter

`providerId` must be a valid MongoDB ObjectId.

### Query parameters

| Parameter | Type                     | Default |
| --------- | ------------------------ | ------: |
| `page`    | positive integer         |     `1` |
| `limit`   | positive integer, max 50 |    `10` |

### Success

**200 OK**

Returns the public provider profile together with paginated active-service information.

The public profile includes information such as:

* provider ID
* display name
* description
* phone
* service area
* availability summary
* rating summary
* creation/update timestamps
* active services
* service pagination metadata

Underlying user account information such as email, password, or account metadata is not exposed.

---

# 8. Services API

## GET `/services`

Returns publicly available services.

### Access

Public.

### Query parameters

| Parameter  | Type                     | Default |
| ---------- | ------------------------ | ------: |
| `q`        | string                   |       — |
| `category` | ObjectId                 |       — |
| `location` | string                   |       — |
| `minPrice` | non-negative number      |       — |
| `maxPrice` | non-negative number      |       — |
| `sort`     | string                   | `title` |
| `page`     | positive integer         |     `1` |
| `limit`    | positive integer, max 50 |    `10` |

### Sort options

* `title`
* `newest`
* `price-asc`
* `price-desc`
* `price_asc` (legacy alias)
* `price_desc` (legacy alias)

### Price rules

Prices:

* cannot be negative
* support at most two decimal places
* cannot exceed ₦1,000,000,000
* require `minPrice <= maxPrice`

### Search behavior

`q` performs a literal, case-insensitive search across relevant service/provider text.

Search punctuation is treated literally rather than as a regular-expression pattern.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {
    "services": [],
    "meta": {}
  },
  "meta": {}
}
```

Only services that are publicly eligible are returned. This includes active services with valid active categories and an active provider account.

---

## GET `/services/:serviceId`

Returns one public service.

### Access

Public.

### Path parameter

`serviceId` must be a valid MongoDB ObjectId.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

The public service representation includes information such as:

* service ID
* provider ID
* provider display name
* category ID
* category name
* title
* description
* price
* currency
* pricing unit
* service area
* availability summary
* status
* rating summary
* timestamps

MongoDB internal fields such as `_id` and `__v` are not exposed as API fields.

---

## POST `/services`

Creates a service for the authenticated provider.

### Access

Authenticated provider.

### Request body

```json
{
  "title": "Standard home cleaning",
  "categoryId": "507f1f77bcf86cd799439011",
  "description": "General household cleaning for your living spaces.",
  "price": 15000,
  "currency": "NGN",
  "pricingUnit": "visit",
  "serviceArea": "Lagos",
  "availabilitySummary": "Weekdays 9am to 5pm"
}
```

### Fields

| Field                 | Rules                               |
| --------------------- | ----------------------------------- |
| `title`               | 3–100 characters                    |
| `categoryId`          | Valid ObjectId                      |
| `description`         | 20–1500 characters                  |
| `price`               | 0–1,000,000,000 NGN, max 2 decimals |
| `currency`            | `NGN`                               |
| `pricingUnit`         | `visit`, `hour`, `job`, `day`       |
| `serviceArea`         | 2–200 characters                    |
| `availabilitySummary` | 5–300 characters                    |

Legacy pricing-unit labels are normalized:

| Legacy value  | Normalized value |
| ------------- | ---------------- |
| `per hour`    | `hour`           |
| `per service` | `job`            |
| `per day`     | `day`            |

New services are created as **inactive**.

The provider is derived from the authenticated account and is not supplied by the client.

### Success

**201 Created**

```json
{
  "success": true,
  "data": {}
}
```

---

## PATCH `/services/:serviceId`

Updates an existing service owned by the authenticated provider.

### Access

Authenticated provider who owns the service.

### Request body

Any non-empty subset of the editable service fields may be supplied.

```json
{
  "title": "Premium home cleaning",
  "price": 20000,
  "description": "Updated service description."
}
```

Ownership and status are not changed through this endpoint.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

## PATCH `/services/:serviceId/status`

Activates or deactivates an owned service.

### Access

Authenticated provider who owns the service.

### Request body

```json
{
  "status": "active"
}
```

Allowed values:

* `active`
* `inactive`

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

# 9. Booking API

Booking routes are mounted under:

```text
/api/v1/bookings
```

## POST `/bookings`

Creates a booking for a service.

### Access

Authenticated customer.

### Request body

```json
{
  "serviceId": "507f1f77bcf86cd799439011",
  "scheduledAt": "2026-10-10T10:00:00.000Z",
  "serviceAddress": "123 Example Street, Lagos, Nigeria",
  "customerNote": "Please call when you arrive."
}
```

### Fields

| Field            | Rules                            |
| ---------------- | -------------------------------- |
| `serviceId`      | Valid ObjectId                   |
| `scheduledAt`    | ISO 8601 date/time with timezone |
| `serviceAddress` | 10–300 characters                |
| `customerNote`   | Optional, max 1000 characters    |

Unknown fields are rejected.

### Success

**201 Created**

```json
{
  "success": true,
  "data": {}
}
```

---

## GET `/bookings`

Lists bookings associated with the authenticated user.

### Access

Authenticated user.

### Query parameters

| Parameter | Type                     | Default |
| --------- | ------------------------ | ------: |
| `status`  | booking status           |       — |
| `from`    | ISO 8601 datetime        |       — |
| `to`      | ISO 8601 datetime        |       — |
| `page`    | positive integer         |     `1` |
| `limit`   | positive integer, max 50 |    `10` |

### Booking statuses

* `pending`
* `accepted`
* `rejected`
* `in_progress`
* `completed`
* `cancelled`

If both `from` and `to` are supplied:

```text
from <= to
```

must be true.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {
    "bookings": [],
    "meta": {}
  },
  "meta": {}
}
```

---

## GET `/bookings/:bookingId`

Returns a booking accessible to the authenticated user.

### Access

Authenticated user with appropriate access to the booking.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

## PATCH `/bookings/:bookingId/status`

Changes a booking status according to the application's booking rules.

### Access

Authenticated user with appropriate access to the booking.

### Request body

```json
{
  "status": "accepted",
  "reason": ""
}
```

### Allowed transition status values

* `accepted`
* `rejected`
* `in_progress`
* `completed`
* `cancelled`

`pending` is not supplied as a transition target through this endpoint.

`reason` is optional and has a maximum length of 500 characters.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

# 10. Test Payment API

Payments in the MVP are represented as payment records rather than a live payment gateway integration.

## POST `/bookings/:bookingId/payments`

Creates a test payment record for a booking.

### Access

Authenticated customer.

### Request body

```json
{
  "method": "test",
  "confirm": true
}
```

### Validation

* `method` must be `test`
* `confirm` must be `true`

### Success

**201 Created**

```json
{
  "success": true,
  "data": {}
}
```

---

## GET `/bookings/:bookingId/payment`

Returns the payment record associated with a booking.

### Access

Authenticated user with access to the booking.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

# 11. Review API

Review routes are mounted directly under:

```text
/api/v1
```

Reviews are associated with bookings, customers, providers, and services.

A booking can have at most one review.

---

## POST `/bookings/:bookingId/review`

Creates a review for one of the authenticated customer's bookings.

### Access

Authenticated customer.

### Request body

```json
{
  "rating": 5,
  "comment": "Excellent service."
}
```

### Fields

| Field     | Type    | Rules                         |
| --------- | ------- | ----------------------------- |
| `rating`  | integer | 1–5                           |
| `comment` | string  | Optional, max 1000 characters |

Unknown fields are rejected.

### Success

**201 Created**

```json
{
  "success": true,
  "data": {}
}
```

---

## GET `/bookings/:bookingId/review`

Returns the authenticated customer's review for a booking.

### Access

Authenticated customer.

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

## GET `/services/:serviceId/reviews`

Returns public reviews for a service.

### Access

Public.

### Query parameters

| Parameter | Type                     | Default |
| --------- | ------------------------ | ------: |
| `page`    | positive integer         |     `1` |
| `limit`   | positive integer, max 50 |    `10` |

### Success

**200 OK**

```json
{
  "success": true,
  "data": {
    "reviews": [],
    "meta": {}
  },
  "meta": {}
}
```

---

# 12. Review Moderation API

These endpoints are restricted to administrators.

## GET `/admin/reviews`

Lists reviews for administrative moderation.

### Access

Authenticated user with the `admin` role.

### Query parameters

| Parameter | Type                     | Default |
| --------- | ------------------------ | ------: |
| `status`  | `published` or `hidden`  |       — |
| `page`    | positive integer         |     `1` |
| `limit`   | positive integer, max 50 |    `10` |

### Success

**200 OK**

```json
{
  "success": true,
  "data": {
    "reviews": [],
    "meta": {}
  },
  "meta": {}
}
```

---

## PATCH `/admin/reviews/:reviewId/moderation`

Updates the moderation status of a review.

### Access

Authenticated administrator.

### Request body

```json
{
  "status": "hidden",
  "reason": "Content violates moderation rules."
}
```

### Fields

| Field    | Rules                            |
| -------- | -------------------------------- |
| `status` | `published` or `hidden`          |
| `reason` | Optional, maximum 500 characters |

### Success

**200 OK**

```json
{
  "success": true,
  "data": {}
}
```

---

# 13. Booking Data and Statuses

Bookings contain references to:

* customer
* provider
* service

They also store snapshots of important service/provider information at booking time, including:

* service title
* provider display name
* agreed price
* currency
* pricing unit

### Payment statuses

* `unpaid`
* `paid`
* `refunded`

### Booking statuses

* `pending`
* `accepted`
* `rejected`
* `in_progress`
* `completed`
* `cancelled`

Booking status history records:

* previous status
* new status
* reason
* user who changed the status
* timestamp

---

# 14. Review Data and Moderation

Reviews contain references to:

* booking
* customer
* provider
* service

### Rating

Ratings must be whole numbers from 1 to 5.

### Moderation status

* `published`
* `hidden`

Moderation records can contain:

* moderation status
* moderation reason
* administrator who performed the moderation
* moderation timestamp

A unique booking reference guarantees one review per booking.

---

# 15. Pagination

Most collection endpoints use:

```text
page
limit
```

Default values:

```text
page = 1
limit = 10
```

Maximum limit:

```text
50
```

Page values must be positive integers.

Invalid, repeated, non-numeric, or unsupported query parameters are rejected by the relevant validators.

Where applicable, collection responses expose pagination metadata through both:

```json
{
  "data": {
    "meta": {}
  },
  "meta": {}
}
```

---

# 16. Standard Response Format

Successful responses generally use:

```json
{
  "success": true,
  "data": {}
}
```

Collection endpoints may additionally expose:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

---

# 17. Error Handling

Errors use a consistent envelope.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "body.fullName",
        "message": "Validation message"
      }
    ]
  }
}
```

Clients should primarily use the HTTP status and `error.code` rather than relying on exact human-readable validation messages.

### Common error statuses

| HTTP Status | Common codes                                                                                          |
| ----------: | ----------------------------------------------------------------------------------------------------- |
|         400 | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_VALUE`                                                   |
|         401 | `INVALID_CREDENTIALS`, `AUTHENTICATION_REQUIRED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_SESSION` |
|         403 | `ACCOUNT_INACTIVE`, `ACCOUNT_UNAVAILABLE`, `FORBIDDEN`                                                |
|         404 | `NOT_FOUND`                                                                                           |
|         409 | `EMAIL_ALREADY_EXISTS`, `DUPLICATE_RESOURCE`                                                          |
|         413 | `PAYLOAD_TOO_LARGE`                                                                                   |
|         500 | `INTERNAL_ERROR`                                                                                      |

Feature-specific operations may expose additional expected error codes.

---

# 18. Validation Rules

The API uses strict request validation.

Unknown fields are generally rejected.

MongoDB IDs must be valid 24-character hexadecimal ObjectIds where an ObjectId is expected.

Dates supplied through booking endpoints must use ISO 8601 date/time values with a timezone.

Passwords:

* must meet the minimum length requirements
* must not exceed 72 UTF-8 bytes
* are never trimmed

Prices:

* must be finite numbers
* cannot be negative
* support at most two decimal places
* cannot exceed ₦1,000,000,000

---

# 19. Authorization and Ownership

Authentication and authorization are separate concerns.

Authentication verifies the user's JWT and loads the active account.

Authorization verifies the user's current role.

Examples:

```text
authorize("customer")
authorize("provider")
authorize("admin")
```

Role authorization does not automatically establish resource ownership.

Provider service operations must also verify that the authenticated provider owns the target service.

Similarly, booking and review operations verify that the authenticated user has access to the relevant resource.

---

# 20. API Route Summary

| Method | Endpoint                              | Access         |
| ------ | ------------------------------------- | -------------- |
| GET    | `/health`                             | Public         |
| POST   | `/auth/register`                      | Public         |
| POST   | `/auth/login`                         | Public         |
| GET    | `/users/me`                           | Authenticated  |
| PATCH  | `/users/me`                           | Authenticated  |
| GET    | `/categories`                         | Public         |
| GET    | `/services`                           | Public         |
| GET    | `/services/:serviceId`                | Public         |
| POST   | `/services`                           | Provider       |
| PATCH  | `/services/:serviceId`                | Provider/Owner |
| PATCH  | `/services/:serviceId/status`         | Provider/Owner |
| GET    | `/providers/me`                       | Provider       |
| PATCH  | `/providers/me`                       | Provider       |
| GET    | `/providers/me/services`              | Provider       |
| GET    | `/providers/:providerId`              | Public         |
| POST   | `/bookings`                           | Customer       |
| GET    | `/bookings`                           | Authenticated  |
| GET    | `/bookings/:bookingId`                | Authenticated  |
| PATCH  | `/bookings/:bookingId/status`         | Authenticated  |
| POST   | `/bookings/:bookingId/payments`       | Customer       |
| GET    | `/bookings/:bookingId/payment`        | Authenticated  |
| POST   | `/bookings/:bookingId/review`         | Customer       |
| GET    | `/bookings/:bookingId/review`         | Customer       |
| GET    | `/services/:serviceId/reviews`        | Public         |
| GET    | `/admin/reviews`                      | Admin          |
| PATCH  | `/admin/reviews/:reviewId/moderation` | Admin          |

---

# 21. Development Setup

Use Node.js 22 or newer.

Install dependencies:

```powershell
npm ci
```

Create `.env` from `.env.example` and configure the required environment variables.

Start the backend:

```powershell
npm run dev
```

The default local API is:

```text
http://localhost:5000/api/v1
```

Run checks with:

```powershell
npm run check
npm test
```

Optional development categories can be created with:

```powershell
npm run seed:categories
```

Development users can be created with:

```powershell
node Backend/scripts/seedUsers.js
```

The seed script creates development accounts for:

* customer
* provider
* admin

The provider must still complete provider onboarding before creating services.

---

# 22. Implementation Notes

* The API uses `/api/v1` as its versioned base path.
* JWT access tokens are used for authentication.
* Logout is client-side token removal; JWTs are not explicitly revoked.
* Refresh tokens are not implemented.
* Password reset/change is not implemented.
* Real payment gateway integration is not implemented in the current MVP.
* CORS is configured for the frontend origin.
* The backend uses centralized validation and error handling.
* Routers are mounted before the `notFound` and error-handling middleware.
* API clients should use the documented response envelope and error codes rather than relying on internal database implementation details.
