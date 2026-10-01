# Member Two provider and service API

All ten routes are mounted under `/api/v1`. Authentication and ownership use Member One's middleware and current database user, not submitted user IDs. This handoff supersedes the original Member Two response examples where they differ.

## Setup and verification

Use the root environment described in [backend-handoff.md](backend-handoff.md). No additional dependencies are required.

```powershell
npm run check
npm test
npm run frontend:build
```

`npm test` includes authentication/profile, provider/service, category seed, and account seed tests. These tests use isolated temporary MongoDB instances and never the application database. `npm run check` checks every backend JavaScript file for syntax and exact casing of local CommonJS imports, including on Windows.

### Development categories

Set `NODE_ENV=development` and confirm that `MONGODB_URI` points to your development database. Then run:

```powershell
npm run seed:categories
```

This writes Cleaning, Plumbing, Electrical, and Gardening only when missing. It preserves existing case-insensitive name matches, IDs, names, status, and timestamps. Stable fixture IDs prevent duplicate categories when the seed runs concurrently. The script refuses production or an unspecified environment. It does not create providers or services. No category-administration endpoint is added.

## Routes

| Method and path | Access | Success data |
| --- | --- | --- |
| GET /categories | Public | Array of `{ id, name }` |
| GET /services | Public | `{ services, meta }` |
| GET /services/:serviceId | Public | Service object |
| POST /services | Active provider | Created inactive service, HTTP 201 |
| GET /providers/me | Active provider | Own profile, or `null` before onboarding |
| PATCH /providers/me | Active provider | Created/updated own profile, HTTP 200 |
| GET /providers/:providerId | Public | Public profile plus `services` and `serviceMeta` |
| GET /providers/me/services | Active provider | `{ services, meta }`, including inactive listings |
| PATCH /services/:serviceId | Provider owner | Updated service |
| PATCH /services/:serviceId/status | Provider owner | Updated service |

All other successful responses use HTTP 200. Every response is wrapped in `{ success: true, data: ... }`. Collection responses also mirror `data.meta` at the top-level `meta` field to preserve the shared envelope. The frontend's existing `apiRequest()` returns `data`, so pagination remains available without changing that helper.

### Collection example

```json
{
  "success": true,
  "data": {
    "services": [],
    "meta": { "page": 1, "limit": 10, "totalItems": 0, "totalPages": 0 }
  },
  "meta": { "page": 1, "limit": 10, "totalItems": 0, "totalPages": 0 }
}
```

Collection query rules:

- `page`: positive integer, default 1, maximum 100000. Pages beyond the final page are clamped to the final available page.
- `limit`: integer 1-50, default 10. Zero, negative, fractional, repeated, and nonnumeric values return HTTP 400.
- Public services: optional `q` (maximum 100 characters), category ObjectId, `location` (maximum 200 characters), `minPrice`, `maxPrice`, and `sort`.
- Search is literal and case-insensitive across title, description, and provider display name. Location is a literal, case-insensitive service-area substring. Regex punctuation is not interpreted.
- Prices in queries use non-negative decimal strings with at most two decimals and cannot exceed 1,000,000,000. `minPrice` cannot exceed `maxPrice`.
- Sort: `title` (default), `newest`, `price-asc`, or `price-desc`. Legacy `price_asc` and `price_desc` are accepted aliases. Every sort includes an ID tie-breaker.
- Own services additionally accept `status=active|inactive`.
- Public provider details accept `page` and `limit` for their service summary.
- Categories accept optional literal `q` name search.
- Unknown query keys and malformed ObjectId path parameters return HTTP 400 with the shared `VALIDATION_ERROR` envelope.

## Provider onboarding

First save requires all five fields:

```json
{
  "displayName": "Fresh Space Cleaning",
  "description": "Residential cleaning and maintenance services.",
  "phone": "08012345678",
  "serviceArea": "Lagos",
  "availabilitySummary": "Weekdays 9am to 5pm"
}
```

Subsequent PATCH requests can contain any nonempty subset. Strings are trimmed. Limits:

| Field | Characters |
| --- | --- |
| displayName | 2-100 |
| description | 20-1500 |
| phone | 7-30 |
| serviceArea | 2-200 |
| availabilitySummary | 5-300 |

Phone validation checks length, not international numbering rules. Unknown fields, blank values, rating changes, identity changes, and empty updates return 400. First-time incomplete saves return field-specific validation details. The unique user index is initialized before the server accepts requests. Concurrent first-time saves may return 409; reload the profile before retrying.

`GET /providers/me` returns `data: null` before onboarding. The own-service list returns an empty collection in that state. A provider must finish onboarding before creating a service.

Profile responses expose `id`, displayName, description, phone, serviceArea, availabilitySummary, ratingSummary, createdAt, and updatedAt. Own-profile responses additionally expose `userId`. Public profiles do not expose the underlying user document, email, password hash, or account metadata.

Public provider responses include a paginated active-service summary as `services` and `serviceMeta`. Inactive, missing, or no-longer-provider accounts return 404.

## Service creation and editing

Use an actual category `id` from `GET /categories`, not a mock slug such as `cleaning`.

```json
{
  "title": "Standard home cleaning",
  "categoryId": "<category ObjectId from GET /categories>",
  "description": "General household cleaning for your living spaces.",
  "price": 15000,
  "currency": "NGN",
  "pricingUnit": "visit",
  "serviceArea": "Lagos",
  "availabilitySummary": "Weekdays 9am to 5pm"
}
```

The category placeholder must be replaced before sending the request. Price is a JSON number in **naira**, not kobo: non-negative, at most two decimal places, maximum 1,000,000,000. Currency may be omitted and defaults to NGN; other currencies are rejected. Member Three must snapshot this amount on the server and convert to integer minor units if a future payment provider requires them.

Title is 3-100 characters; description 20-1500; serviceArea 2-200; availabilitySummary 5-300. Pricing units are `visit`, `hour`, `job`, and `day`. Legacy inputs/read records normalize as follows: `per hour -> hour`, `per service -> job`, `per day -> day`.

New services start **inactive**. Publish using:

```json
{ "status": "active" }
```

Send this body to `PATCH /services/:serviceId/status`. The same route accepts `inactive`. General service PATCH accepts only the editable creation fields, rejects empty updates, and cannot change ownership or status. Category references must point to active existing categories when creating, changing categories, or activating a service.

### Service response fields

- `id`: service ID.
- `providerId`: **ServiceProvider profile ID**, not User ID.
- `provider`: safe `{ id, displayName }` summary.
- `categoryId`, `categoryName`.
- title, description, price, currency, pricingUnit, availabilitySummary, status.
- `serviceArea` and its display alias `location`.
- ratingSummary, createdAt, updatedAt.

MongoDB's `_id` and `__v` are not exposed. Public results require an active service, active category, and an existing active user whose current role is provider. Missing related records return 404 or are excluded from public lists rather than causing 500s. An owner can still see and repair a listing with a missing category; its categoryId is null and categoryName is "Unavailable category".

The frontend must not assume a provider ID is a user ID. Member Three should follow `Service.provider -> ServiceProvider.user` to enforce booking participant ownership.

## Remaining integration boundaries

- **Reviews:** no Review model exists yet. `ratingSummary` explicitly returns `{ available: false, averageRating: null, ratingCount: null }`. Member Four must replace this with derived data; do not display it as a zero-star rating.
- **Moderation:** Member Four's backend is not present. Coordinate independent administrator moderation state before connecting admin controls, so provider reactivation cannot override an admin block.
- **Frontend:** catalogue/profile/service pages remain in demo mode. Switch their service modules to API calls in a separate integration step. Provider forms now accept `day` and the same money limits as this contract.
- **Pagination:** public service adapters can consume `data.services` and `data.meta` directly. The current own-service mock returns a plain array; its API adapter/page must handle paginated results rather than silently dropping later pages.
- **Data:** no existing application records are migrated or deleted. Legacy pricing labels are normalized at the API boundary; omitted currency reads as NGN. Existing service statuses remain unchanged. Legacy records with shorter text can receive partial updates; new or changed fields must satisfy current validation.
- Category IDs must be fetched from the API when integrating; do not send the mock category slugs.
- Refresh the API server after installing these changes. No new npm dependencies were introduced.
