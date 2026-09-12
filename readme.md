# Client Intake Case Tracking Frontend

React/Vite frontend for the Client Intake & Case Tracking API.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the Flask API origin. For local backend development, use:

```env
VITE_API_BASE_URL=http://127.0.0.1:5001
```

## Current Scope

- JWT login against `POST /login`
- Session restore through `GET /auth/me`
- Protected app routes
- Case list with pagination and filters
- Case workflow actions for stage and status
- Client list and creation form
- Admin-only user list and creation form
