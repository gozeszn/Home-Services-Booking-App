# Home Services Booking App — MVP Requirements

## 1. Purpose

The Home Services Booking App connects customers who need household services with service providers who can perform them. The MVP must support the complete journey from creating an account to completing and reviewing a booking.

This document is the initial product baseline. Any feature not listed under the MVP scope should be treated as a later enhancement unless the team agrees to a scope change.

## 2. Working assumptions

- The project is being delivered by four team members.
- The first release is a responsive web application.
- The backend uses Node.js, Express, MongoDB/Mongoose, and JWT authentication.
- The frontend uses React.
- A user has one primary role: `customer`, `provider`, or `admin`.
- Payments are recorded in the MVP, but real payment-gateway integration is a stretch goal unless it is explicitly required by the project brief.

## 3. Users and roles

### Customer

A customer can create an account, find a service, request a booking, track its status, and review a completed service.

### Service provider

A provider can create a service profile, publish services, manage incoming bookings, and update the status of accepted work.

### Administrator

An administrator can view users, services, and bookings and can deactivate inappropriate accounts or service listings.

## 4. MVP scope

### 4.1 Authentication and accounts

- Register as a customer or service provider.
- Log in and receive an authenticated session using JWT.
- View and update the signed-in user's profile.
- Store passwords as secure hashes; never return password hashes through the API.
- Protect role-specific routes with authentication and authorization middleware.
- Log out on the client by clearing the stored session/token.

Password reset, social login, email verification, and multi-factor authentication are outside the initial MVP.

### 4.2 Service-provider profiles and services

- A provider can create and update a public profile containing a display name, description, location/service area, phone number, and availability summary.
- A provider can create, update, activate, and deactivate service listings.
- Each service contains a title, category, description, price, pricing unit, and availability state.
- Customers can browse active services and filter them by category and location.
- Customers can view service and provider details before booking.

### 4.3 Bookings

- An authenticated customer can request a service for a future date and time.
- A booking records the customer, provider, service, agreed price, address, scheduled time, optional customer note, and current status.
- Booking status follows this lifecycle: `pending -> accepted -> in_progress -> completed`.
- A provider may reject a pending booking.
- A customer may cancel a pending or accepted booking before work begins.
- Invalid status transitions must be rejected by the backend.
- Customers and providers can view their relevant booking histories.

### 4.4 Reviews and ratings

- A customer can submit one rating and review for a completed booking.
- A rating is an integer from 1 to 5.
- Reviews are visible on the provider/service detail view.
- A provider's displayed average rating is derived from its reviews.

### 4.5 Administration

- An administrator can list users, services, and bookings.
- An administrator can deactivate or reactivate a user or service listing.
- Deactivated users cannot log in, and deactivated services cannot receive new bookings.

### 4.6 Payment record

- A booking can show a payment state of `unpaid`, `paid`, or `refunded`.
- For the MVP, payment state may be updated through a safe simulated/test flow.
- A real payment provider, stored cards, payouts, and financial reconciliation are not part of the initial MVP.

## 5. Core business rules

- Email addresses must be unique and stored in normalized form.
- A customer cannot book their own service.
- Only an active service can be booked.
- Providers can manage only their own services and assigned bookings.
- Customers can manage only their own bookings and reviews.
- Only completed bookings can be reviewed.
- Booking and review ownership is always checked on the server, not only in the UI.
- All prices are stored as non-negative values using one consistent currency and representation selected by the team before implementation.
- Timestamps are stored in UTC and displayed in the user's local time.

## 6. Main user journeys

### Customer journey

1. Register or log in.
2. Browse or filter active services.
3. Open a service and provider profile.
4. Request a booking with a schedule, address, and note.
5. Track the booking through completion.
6. Submit a rating and review.

### Provider journey

1. Register or log in as a provider.
2. Complete the provider profile.
3. Create and publish a service.
4. Accept or reject a booking request.
5. Mark accepted work in progress and then completed.

### Administrator journey

1. Log in with an administrator account.
2. Review users, listings, and bookings.
3. Deactivate or reactivate an account or listing when necessary.

## 7. Non-functional requirements

- Validate every API request and return consistent JSON errors.
- Keep secrets and environment-specific settings outside source control.
- Use appropriate HTTP status codes and avoid exposing stack traces in production.
- Hash passwords with bcrypt and verify JWT signatures and expiry.
- Restrict cross-origin access to the configured frontend origin.
- Provide loading, empty, success, and error states in the UI.
- Support current desktop and mobile browser widths.
- Keep route handlers, business logic, data models, and middleware separated.
- Include automated tests for authentication and critical booking rules.
- Document setup steps, environment variables, and API endpoints.

## 8. MVP completion criteria

The MVP is complete when all of the following can be demonstrated:

- A customer and provider can register and log in.
- The provider can publish an active service.
- The customer can find the service and create a booking.
- The provider can accept and complete the booking using valid status changes.
- The customer can review the completed booking.
- Both users see correct role-specific booking data.
- An administrator can deactivate a user or service.
- Unauthorized access and invalid booking transitions are rejected.
- Critical API tests pass and a new developer can run the project from the README.

## 9. Features deferred until after the MVP

- Real payment-gateway integration and provider payouts.
- Live chat, video calls, and attachments.
- Real-time location tracking.
- Push, SMS, and email notifications.
- Maps, distance-based matching, and route calculation.
- Recurring bookings, coupons, subscriptions, and loyalty schemes.
- Provider identity verification and document uploads.
- Native Android or iOS applications.
- Advanced analytics and recommendation systems.

## 10. Team responsibilities

The following is a four-member working split. If the actual team size differs, retain the ownership areas and redistribute them rather than splitting individual features across multiple owners.

### Member One — Backend foundation and authentication

- Maintain the project structure, shared configuration, and backend conventions.
- Configure Express, MongoDB, environment validation, CORS, and error handling.
- Implement the User model, registration, login, profile, JWT authentication, and role-based authorization.
- Define shared API response/error formats and request-validation patterns.
- Supply authenticated test users or seed data needed by other members.
- Review integrations that touch authentication or shared backend infrastructure.

**First deliverable:** a documented API where a customer or provider can register, log in, and access a protected profile endpoint.

### Member Two — Services and provider experience

- Implement provider profiles and service/category data models.
- Build service CRUD endpoints, ownership checks, search, and filtering.
- Build provider profile and service-management screens.
- Coordinate with Member One on provider authorization.

### Member Three — Booking and payment-state workflow

- Implement the booking data model and valid status-transition rules.
- Build customer/provider booking endpoints and booking-history screens.
- Implement the MVP payment-record or simulated payment flow.
- Coordinate with Member Two on service availability and agreed pricing.

### Member Four — Customer experience, reviews, and administration

- Build customer service discovery and service-detail screens.
- Implement review/rating endpoints and UI.
- Implement the minimum administration endpoints and dashboard.
- Lead end-to-end UI integration, responsive checks, and acceptance testing.

### Shared responsibilities

- Agree on API contracts before integrating features.
- Use feature branches and focused pull requests.
- Add tests for owned business rules.
- Review at least one other member's work.
- Update documentation when behavior or setup changes.
- Run the full test and manual acceptance checklist before merging.

## 11. Initial implementation order

1. Member One establishes the backend server, database connection, shared errors, validation, and authentication contract.
2. Member Two adds provider profiles and services using the authenticated user.
3. Member Three adds bookings once service identifiers and ownership are stable.
4. Member Four connects discovery, reviews, and administration across the stable APIs.
5. The team performs an end-to-end acceptance pass against Section 8.
