# Frontend foundation

React application with browser routing, responsive shared layout, a home page, a fallback page, and a development-only backend connection check. Authentication forms will be added in the next step.

## Setup from the repository root

React, React DOM, and React Router are already declared in the root package.json. Install Vite:

```powershell
npm install --save-dev vite
```

Add these entries to the root package.json scripts object, preserving existing scripts:

```json
"frontend:dev": "vite Frontend --port 5173 --strictPort",
"frontend:build": "vite build Frontend",
"frontend:preview": "vite preview Frontend --port 5173 --strictPort"
```

The development API URL defaults to http://localhost:5000/api/v1. To configure it, copy Frontend/.env.example to Frontend/.env. Preserve any existing environment file. Frontend VITE_ variables are public; never put JWT secrets or database credentials here.

Start the backend in one terminal:

```powershell
npm run dev
```

Start the frontend in another terminal:

```powershell
npm run frontend:dev
```

Open http://localhost:5173. Ensure the backend's root .env sets CLIENT_ORIGIN=http://localhost:5173 and restart the backend after changing it. Restart Vite after changing frontend environment settings.

## Manual verification

- The home page should display a successful backend connection message.
- An unknown route should display the fallback page with a working Home link.
- Check the layout at mobile and desktop widths.
- Stop the backend and reload: the development connection check should report failure.
- Run npm run frontend:build to verify compilation; npm run frontend:preview serves the output without the development connection check.

Build output is ignored by Frontend/.gitignore. BrowserRouter requires a fallback to index.html when deploying to a static host. No build, dependency installation, or runtime verification was performed during scaffold creation.
