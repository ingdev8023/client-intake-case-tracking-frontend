# Frontend Starter Plan

This document defines the first frontend implementation plan for the Client Intake & Case Tracking API.

The purpose is to create a clean, minimal frontend that proves real integration with the backend before adding advanced UI, dashboards, analytics, or complex workflows.

---

## 1. Objective

Build a Vite + React frontend that can:

- log in users
- store a JWT access token
- call protected backend routes
- restore the current session with `/auth/me`
- display cases
- display clients
- display case details
- support basic case workflow actions
- show admin-only UI for admin users
- hide admin-only UI from staff users

The first frontend version should prioritize correctness and integration over visual complexity.

---

## 2. Backend Contract

The frontend will consume the Flask API.

Backend base URL should come from an environment variable:

```env
VITE_API_BASE_URL=http://127.0.0.1:5001

For server/LAN testing:

VITE_API_BASE_URL=http://192.168.101.17

For temporary Cloudflare Tunnel testing:

VITE_API_BASE_URL=https://<temporary-trycloudflare-url>

Future production:

VITE_API_BASE_URL=https://api.<custom-domain>

3. Target Frontend Stack

Initial stack:

Vite
React
React Router
Fetch API
localStorage
Plain CSS or CSS modules

Do not add heavy libraries in the first version unless they solve an immediate problem.

Avoid initially:

Redux
complex state management
component libraries
advanced dashboard libraries
server-side rendering

The first goal is API integration.

Proposed Frontend Folder Structure
src/
├── api/
│   ├── client.js
│   ├── authApi.js
│   ├── casesApi.js
│   ├── clientsApi.js
│   └── usersApi.js
├── auth/
│   ├── AuthProvider.jsx
│   └── ProtectedRoute.jsx
├── components/
│   ├── Layout.jsx
│   ├── Navbar.jsx
│   ├── Loading.jsx
│   └── ErrorMessage.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── CasesPage.jsx
│   ├── CaseDetailPage.jsx
│   ├── ClientsPage.jsx
│   ├── ClientDetailPage.jsx
│   └── UsersPage.jsx
├── App.jsx
├── main.jsx
└── index.css
6. Environment Variables

The frontend must not hardcode the backend API URL.

Use:

VITE_API_BASE_URL=http://127.0.0.1:5001

Example frontend .env.example:

VITE_API_BASE_URL=http://127.0.0.1:5001

Local development examples:

# Local Flask dev server
VITE_API_BASE_URL=http://127.0.0.1:5001

# LAN server through Nginx
VITE_API_BASE_URL=http://192.168.101.17

# Temporary Cloudflare Tunnel
VITE_API_BASE_URL=https://temporary-url.trycloudflare.com

Never commit real secrets to frontend .env files.

The API base URL is not a secret, but environment-specific values should still be managed intentionally.

7. First Routes

Initial frontend routes:

/login
/dashboard
/cases
/cases/:caseId
/clients
/clients/:clientId
/users

Access rules:

Route	Access
/login	Public
/dashboard	Authenticated users
/cases	Authenticated users
/cases/:caseId	Authenticated users
/clients	Authenticated users
/clients/:clientId	Authenticated users
/users	Admin only
8. Authentication Flow

Login endpoint:

POST /login

Request body:

{
  "user_email": "admin@test.com",
  "user_password": "password"
}

Successful response:

{
  "access_token": "<jwt_token>",
  "user": {
    "user_id": 1,
    "user_name": "Admin User",
    "user_email": "admin@test.com",
    "user_role": "admin",
    "is_active": true
  }
}

Frontend login behavior:

1. User submits email/password
2. Frontend sends POST /login
3. Backend returns access_token and user
4. Frontend stores access_token
5. Frontend stores current user in auth state
6. User is redirected to /dashboard or /cases

Initial token storage:

localStorage.setItem("access_token", data.access_token);

Logout:

localStorage.removeItem("access_token");
9. Session Restore Flow

When the frontend reloads, React memory state is lost.

The token may still exist in localStorage.

The frontend should call:

GET /auth/me

Behavior:

1. App starts
2. Check localStorage for access_token
3. If token exists, call GET /auth/me
4. If valid, set currentUser
5. If invalid, remove token and redirect to /login
10. API Client

Create a central API helper.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 422) {
    localStorage.removeItem("access_token");
  }

  return response;
}

Reason:

All API calls should share token handling, base URL handling, and common auth failure behavior.
11. Auth API Module

Create:

src/api/authApi.js

Responsibilities:

login
getCurrentUser
logout helper

Example functions:

import { apiRequest } from "./client";

export async function login(email, password) {
  const response = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({
      user_email: email,
      user_password: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.msg || "Login failed");
  }

  localStorage.setItem("access_token", data.access_token);

  return data.user;
}

export async function getCurrentUser() {
  const response = await apiRequest("/auth/me");

  if (!response.ok) {
    throw new Error("Unable to load current user");
  }

  return response.json();
}

export function logout() {
  localStorage.removeItem("access_token");
}
12. Cases API Module

Create:

src/api/casesApi.js

Responsibilities:

list cases
get case by id
create case
update case stage
update case status
update case type
update assigned users
reassign client
soft delete case

Example:

import { apiRequest } from "./client";

export async function getCases({ page = 1, limit = 10 } = {}) {
  const response = await apiRequest(`/cases?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error("Unable to load cases");
  }

  return response.json();
}

export async function getCase(caseId) {
  const response = await apiRequest(`/cases/${caseId}`);

  if (!response.ok) {
    throw new Error("Unable to load case");
  }

  return response.json();
}

export async function updateCaseStage(caseId, caseStage) {
  const response = await apiRequest(`/cases/${caseId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({
      case_stage: caseStage
    })
  });

  if (!response.ok) {
    throw new Error("Unable to update case stage");
  }

  return response.json();
}
13. Role-Based UI

The backend is the source of truth for authorization.

The frontend can use roles for user experience only.

Admin check:

const isAdmin = currentUser?.user_role === "admin";

Admin users may see:

users page
create user action
activate/deactivate user actions
soft delete case action

Staff users should not see:

user management page
soft delete case button
admin-only actions

Important:

Hiding a button is not security.
Backend authorization is security.
14. MVP Screens
Login Page

Purpose:

Authenticate user and store JWT token.

Fields:

Email
Password
Submit button
Error message area

Success behavior:

Redirect to /dashboard or /cases.
Dashboard Page

Purpose:

Simple landing page after login.

Initial content:

Current user name
Current user role
Quick links to Cases, Clients, Users if admin
API status indicator, optional
Cases Page

Purpose:

List cases with pagination and basic filters.

Initial content:

Table or cards
Case ID
Case type
Case status
Case stage
Client name
Assigned users
Link to detail page
Pagination controls

Filters:

case_status
case_stage
case_type
client_id
Case Detail Page

Purpose:

Show one case and allow workflow actions.

Initial content:

Case details
Client info
Assigned users
Current stage
Current status
Current type
Workflow buttons/dropdowns
Audit logs link or section

Actions:

Update stage
Update status
Update type
Add/remove assigned users
Reassign client
Soft delete case, admin only
Clients Page

Purpose:

List clients and navigate to client details.

Initial content:

Client name
Email
Phone
Address
Date of birth
Link to details
Client Detail Page

Purpose:

Show client profile and related information.

Initial content:

Client personal information
Related cases if supported by backend response
Edit client button
Users Page

Purpose:

Admin-only user management.

Initial content:

List users
Name
Email
Role
Active status
Create user form or button
Activate/deactivate controls
15. Error Handling Rules

Frontend should handle common API status codes consistently.

400 Bad Request

Meaning:

Invalid input or missing required fields.

Behavior:

Show validation error.
Keep user on current form.
401 Unauthorized

Meaning:

Missing or invalid authentication.

Behavior:

Clear token.
Redirect to login.
403 Forbidden

Meaning:

Authenticated but not authorized.

Behavior:

Show permission error.
Do not automatically redirect to login.
404 Not Found

Meaning:

Resource does not exist or was soft deleted.

Behavior:

Show not found message.
Offer navigation back to list page.
422 Unprocessable Entity

Meaning:

Malformed JWT or invalid request format.

Behavior:

If token-related, clear token and redirect to login.
Otherwise show request error.
16. CORS Requirements

The backend must allow the frontend origin.

For local Vite frontend:

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

For Netlify frontend later:

CORS_ORIGINS=https://<frontend-name>.netlify.app

For custom domain later:

CORS_ORIGINS=https://app.<custom-domain>

The backend must allow:

Authorization
Content-Type

because the frontend sends JWT tokens and JSON bodies.

17. First Frontend Milestone

The first frontend milestone is not a full CRM.

The first milestone is:

User can log in
User session restores after refresh
User can view case list
User can open case detail
Protected routes redirect unauthenticated users
Admin-only page is hidden from staff

This proves the frontend and backend are integrated.

18. Frontend Testing Checklist

Before calling the frontend MVP complete, verify:

Login works with real backend admin user
Invalid login shows error
Token is stored after login
Refresh keeps session using /auth/me
Logout removes token
/cases loads with token
/cases fails without token
Staff user cannot see admin-only UI
Admin user can see admin-only UI
API base URL works from .env
CORS does not block local frontend
19. Suggested First Build Order

Build in this order:

1. Create Vite React app
2. Add React Router
3. Add .env and .env.example
4. Create api/client.js
5. Create authApi.js
6. Create AuthProvider
7. Create LoginPage
8. Create ProtectedRoute
9. Create Layout/Navbar
10. Create DashboardPage
11. Create CasesPage
12. Create CaseDetailPage
13. Add role-based UsersPage

Reason:

Authentication first. Everything else depends on it.
20. Codex Context

When using Codex to build the frontend, provide:

docs/frontend-integration.md
docs/frontend-starter-plan.md
docs/api-endpoints.md

Core instructions for Codex:

Build a Vite + React frontend for the existing Flask API.
Use JWT authentication.
Use Authorization: Bearer <token>.
Use VITE_API_BASE_URL.
Use /login for authentication.
Use /auth/me for session restore.
Use protected routes.
Use role-based UI for admin/staff.
Keep the first version simple and focused on API integration.
21. Current Decision

Frontend strategy:

Separate Vite + React project.

First milestone:

Authentication + protected case list.

Design priority:

Simple, functional, readable.

Future improvements:

better UI design
dashboard metrics
forms
audit log timeline
case workflow UX
Netlify deployment
custom domain
end-to-end tests

Then commit it:

```bash
git add docs/frontend-starter-plan.md
git commit -m "Add frontend starter plan"
git push