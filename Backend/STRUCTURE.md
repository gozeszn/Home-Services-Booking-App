# Backend structure

The backend entry point is `src/server.js`. It starts the HTTP listener after the application and its external dependencies are ready. `src/app.js` creates and configures the Express application without opening a network port, which keeps it easy to test.

## Folders

- `src/config` — environment and database configuration.
- `src/controllers` — HTTP request handlers; controllers translate between HTTP and the application layer.
- `src/middleware` — authentication, authorization, validation, and error middleware.
- `src/models` — Mongoose schemas and models.
- `src/routes` — Express routers and endpoint definitions.
- `src/services` — reusable business logic that should not live in controllers.
- `src/utils` — small shared helpers and application error types.
- `src/validators` — Zod request schemas.
- `test.js` — initial Node test-runner entry; it may later import focused test files as the suite grows.

## Dependency direction

Routes call middleware and controllers. Controllers call services. Services use models and utilities. Models and utilities must not import controllers or routes.

Keep `app.js` free of `listen()` calls and keep `server.js` free of feature logic.

## Commands

- `npm run dev` — run the backend with automatic restart through Nodemon.
- `npm start` — run the backend normally.
- `npm test` — execute the Node test suite.
- `npm run test:watch` — rerun tests while files change.
- `npm run check` — check the backend entry files for JavaScript syntax errors.
