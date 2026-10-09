# Frontend Code Guide

This guide explains how the React frontend is put together, how it talks to the Flask API, and the main React and application concepts used in the code. It is written for someone learning the project, so it follows the path from opening the app to submitting a form.

## 1. The Big Picture

The frontend is a separate web application. React renders the screens in the browser, React Router chooses which screen matches the current URL, and the Flask backend stores and validates the real application data.

```text
Browser URL
    |
    v
React Router -> Page component -> API function -> shared apiRequest()
                                                |
                                                v
                                      Flask API + database
                                                |
                                                v
React state updates <- JSON response <- HTTP response
```

For local development, the browser calls the Vite server at `/api/...`. Vite forwards that request to the backend tunnel and removes the `/api` prefix. This avoids making a direct cross-origin browser request during development.

The main code is organized by responsibility:

| Folder | Responsibility |
| --- | --- |
| `src/pages` | Full screens such as cases, clients, and login |
| `src/components` | Small pieces shared by multiple screens |
| `src/api` | HTTP requests and backend endpoint functions |
| `src/auth` | Shared login state and route protection |
| `src/utils` | Reusable data formatting and workflow helpers |

## 2. How the App Starts

`src/main.jsx` is the browser entry point. It creates the React root, wraps the application in `AuthProvider`, and gives the router to React Router. The provider is above the routes so every page can access the current login state.

The route table in that file maps URLs to components:

| URL | Screen | Access |
| --- | --- | --- |
| `/login` | Login | Public |
| `/dashboard` | Dashboard | Signed in |
| `/cases` | Case list | Signed in |
| `/cases/new` | Create case | Signed in |
| `/cases/:caseId` | Case detail | Signed in |
| `/clients` | Client list and creation form | Signed in |
| `/clients/:clientId` | Client detail and edit form | Signed in |
| `/users` | User administration | Admin role in the frontend |

The `:caseId` and `:clientId` parts are route parameters. For example, `/cases/12` matches `/cases/:caseId`, with `caseId` equal to `12`.

`AppLayout` is a parent route. It draws the sidebar and main page area once. The child page is inserted where the layout renders React Router's `<Outlet />`. The root URL redirects to the dashboard, and unknown URLs also redirect there.

## 3. React Concepts Used

### Components

A React component is a JavaScript function that returns JSX, which looks like HTML but can include JavaScript expressions and other components. For example, `CasesPage` returns a page header, filter form, and case table. Components keep the interface in pieces that can be read and changed independently.

### Props

Props are values passed from a parent component to a child component. `PageHeader` receives `title`, `description`, and `actions`; `StatusBadge` receives its displayed text and color tone. They do not need to know which page supplied those values.

### State and `useState`

State is data that can change while the screen is open. `useState` gives a component a current value and a setter. Updating state tells React to render the component again with the new value.

Examples in this project:

- `CasesPage` stores the current cases, filters, loading state, and error.
- `LoginPage` stores the email and password as the user types.
- `NewCasePage` stores form fields and selected assigned users.
- `CaseDetailPage` stores the case data and the values currently selected in its workflow controls.

Inputs such as `<input value={form.email} onChange={...} />` are controlled inputs: React state is the source of the displayed value, and each change updates that state.

### Effects and `useEffect`

`useEffect` runs work associated with a rendered component, commonly loading data from an API. A dependency array controls when the effect runs. An empty array means run after the initial mount; a value such as `[caseId]` means run when the component first appears and when that ID changes.

For example, the case detail screen loads the selected case when `caseId` changes. A refresh button can call the same loading function directly.

### `useAuth` is a project hook

`useAuth` is not a built-in React feature. It is a custom hook defined in `src/auth/AuthProvider.jsx`. It calls React's `useContext` to read the shared authentication value and gives components a simple interface:

```js
const { currentUser, isAdmin, login, logout } = useAuth();
```

The custom hook also checks that it is used below `<AuthProvider>`. This produces a clear error if a page is accidentally rendered outside the provider.

`AuthProvider` keeps the user and session-restoration state, and supplies them through React Context. Context is useful here because many distant components need the same login information; it avoids passing `currentUser` through every parent and child as props.

### `useNavigate` comes from React Router

`useNavigate` is a React Router hook. It returns a function for changing the URL from code after an action completes. It is useful after form submission or logout, where a normal link is not the right interaction.

Examples:

- After a case is created, `NewCasePage` navigates to that case's detail URL.
- After a case is deleted, `CaseDetailPage` navigates back to the case list.
- After logout, `AppLayout` navigates to `/login`.

Use a `<Link>` for a user-clickable link in the page. Use `navigate(...)` when code should move the user after an event.

### Other Router hooks and components

- `useParams()` reads values from a route such as `:caseId`.
- `useLocation()` reads the current location and optional navigation state. The login page uses this to return the user to a page they tried to open before signing in.
- `<Navigate>` redirects as part of rendering, such as sending a signed-out visitor to login.
- `<NavLink>` creates navigation links and knows when a route is active.
- `<Outlet>` marks where a matched child route renders inside its parent layout.

### `useMemo` and `useCallback`

`useMemo` keeps a calculated value until one of its dependencies changes. The dashboard uses it to calculate its small metric list. `useCallback` keeps a function reference stable; the auth provider uses it for its `login` and `logout` functions. These are performance and dependency-management tools, not required for every component.

## 4. Authentication and Protected Pages

The login flow is:

1. The login form calls the `login` function from `useAuth`.
2. `AuthProvider` calls `login` in `src/api/authApi.js`.
3. The API function sends `POST /login` with `user_email` and `user_password`.
4. On success, it stores `access_token` in browser `localStorage` and returns the user object.
5. `AuthProvider` stores that user in React state. The page navigates to the page originally requested, or the dashboard.

React state exists only in memory and is lost when the browser reloads. On startup, `AuthProvider` checks for a stored token. If one exists, it calls `GET /auth/me` to ask the backend whether that token still represents a valid session. While this request is pending, `ProtectedRoute` shows a restoring-session state rather than briefly redirecting the user to login.

`ProtectedRoute` checks that a user is signed in. `AdminRoute` checks whether the current user's role is `admin`. These checks control what the frontend displays and which pages it opens. They are not security boundaries: the Flask backend must independently authenticate and authorize every protected endpoint.

Logout removes the token from local storage, clears the user in React state, and returns to the login page.

## 5. How a Page Talks to the Backend

API code is split into two layers.

### Endpoint modules

Files such as `casesApi.js`, `clientsApi.js`, `usersApi.js`, and `authApi.js` give each backend operation a named JavaScript function. For example, `createCase(payload)` knows the endpoint and HTTP method for case creation. A page can call that function without repeating URL construction and fetch details.

### Shared HTTP helper

`src/api/client.js` defines `apiRequest`. It:

- joins the configured API base URL with a path;
- reads the saved token and adds `Authorization: Bearer ...` when present;
- sends the request with the Fetch API;
- provides helpers to parse JSON and turn unsuccessful HTTP responses into JavaScript errors.

The endpoint module returns parsed data through `expectJson`, or throws an `Error`. The page catches that error and puts its message into React state so the screen can show it.

### Example: creating a case

The full path in `NewCasePage` is:

```text
User selects client, type, stage, status, and users
 -> onChange handlers update form state
 -> submit handler converts IDs to numbers and builds a payload
 -> createCase(payload)
 -> apiRequest("/cases", { method: "POST", body: JSON.stringify(payload) })
 -> Authorization token is attached
 -> Flask validates and stores the case
 -> response JSON returns to the page
 -> navigate to /cases/<new id>
```

The user sees names in the interface, but the API uses identifiers to relate records. The page loads clients and users for the dropdowns, renders a person's name, and submits the selected numeric ID. That keeps IDs out of the ordinary workflow while preserving the backend's relational data model.

Other forms follow the same pattern. For example, editing a client sends the backend field names `client_first_name`, `client_lastname`, `client_email`, `client_phone`, `client_address`, and `client_date_of_birth` to `PUT /clients/:clientId`.

## 6. What the `utils` Folder Is For

`utils` means utilities: small functions that can be reused by several screens and are not themselves screens or API calls. This avoids copying the same conversion rules into every page and helps keep components focused on displaying the interface and handling interactions.

### `display.js`

The `display` name refers to helpers that read and prepare values for presentation. Backend response shapes and property spellings have varied during integration. For example, a first name might arrive as `client_firstname` or `client_first_name`. The `getClientFirstName` function checks the supported names in one place. `getClientFullName` combines first and last names and falls back to another available name field.

The same file has helpers for client IDs, email, phone, address, date of birth, case number, case-to-client IDs, and user names. The screens call these helpers rather than each writing their own fallback logic.

This is a frontend compatibility layer, not a database model and not a replacement for a consistent API contract. Once the backend response format is stable, we can simplify the helpers to match the official field names. If the backend sends a field in none of the recognized formats, the helper cannot infer it; we would add the correct field name or fix the API response.

### `workflow.js`

This file contains the stage names, status choices, and allowed next-stage map used by the controls. `getAllowedNextStages(currentStage)` returns the options the case detail screen should offer from the current stage.

## 7. Why the Workflow Exists in Both Places

The backend owns the actual case workflow. It must decide whether a requested transition is valid, save the change, and reject invalid transitions. The frontend's transition map is only there to make the interface easier to use: it avoids offering choices that the backend is expected to reject.

The tradeoff is duplicated rules. If the backend workflow changes and `src/utils/workflow.js` is not updated, the interface can show stale choices. The backend still protects the data, but users may see an error after selecting a choice that no longer applies.

Good options as the project grows:

1. Keep the small map in the frontend and update it alongside backend workflow changes. This is simple and works for a small, stable workflow.
2. Have the backend return allowed transitions (for example, with the case detail response or a workflow metadata endpoint). The frontend then renders the backend-provided choices, avoiding duplicate business rules.
3. Keep frontend choices as guidance but always treat backend validation and response as authoritative.

For this project, option 3 is essential. Option 2 is the cleaner long-term direction if the workflow changes often. Even then, the backend must validate again when the update request arrives; frontend-provided options can be stale or altered by a client.

## 8. What MVP Means Here

MVP means Minimum Viable Product: the smallest usable version that proves the main user journey and integration before investing in a broader product. It does not mean unfinished security or that the backend can trust the browser.

The original MVP goal was to prove that a user can sign in, restore their session, view cases, open a case, and see admin-only screens only for an admin. As the work proceeded, the interface grew to include the practical operations needed to use the API: create cases and clients, edit client profiles, and run case workflow actions.

The implementation still favors a direct, understandable structure: page components, a small API layer, React Context for auth, and plain CSS. It does not introduce a large global state framework or a generic form system. That keeps the first version easier to connect to the existing backend and easier to learn. Later additions such as audit history, stronger form validation, and backend-provided workflow metadata can be added when they solve a concrete need.

## 9. Shared Components

- `AppLayout` owns the sidebar and logged-in navigation.
- `PageHeader` gives pages a consistent title, description, and action area.
- `StateBlock` displays loading, error, empty, and success messages.
- `StatusBadge` displays a short status with a visual tone.

These are deliberately small. If two or more pages need the same visual or behavior, a component can prevent them from drifting apart.

## 10. Development Configuration

`VITE_API_BASE_URL` tells browser code where the API begins. In this setup it is `/api`, which means the browser talks to the same local Vite origin. `API_PROXY_TARGET` is read by `vite.config.js` on the development server and points Vite at the Flask server or Cloudflare tunnel. Vite removes `/api` before forwarding the request.

Vite exposes variables starting with `VITE_` to browser code. Do not put passwords, secret API keys, or signing keys in a `VITE_` variable: browser users can inspect them. The tunnel address is a location, not an authentication secret. The local `.env` is ignored by Git; `.env.example` documents the expected variable names.

The development proxy is a local development convenience. A production deployment needs its own API URL and an appropriate HTTPS and origin configuration.

## 11. Security Notes and Current Caveats

- **The backend must enforce access.** A user can edit browser code or call API endpoints directly. Frontend route guards, hidden links, and hidden buttons only improve the interface.
- **The access token is stored in `localStorage`.** This is straightforward for an MVP, but JavaScript running through a successful cross-site scripting attack could read it. Production should reduce XSS risk and consider a backend-managed `HttpOnly`, `Secure`, `SameSite` cookie session design where appropriate.
- **Every endpoint needs backend authorization.** In particular, user administration, deleting cases, client data, and workflow updates need appropriate role and record-level checks on the Flask side.
- **Validation belongs on both sides.** Browser validation helps users catch missing or malformed input. The backend must repeat validation because requests can bypass the UI.
- **Current 422 handling is too broad.** `apiRequest` currently clears the token and dispatches `auth:expired` for both 401 and 422. A 422 can mean a validation problem rather than an expired session, so this can sign out a user after a bad request. This should be narrowed to the backend's actual token-expiration response, usually 401, or to a specific documented error code.
- **The transition map can become stale.** The backend must remain authoritative, and returning available transitions from the backend would remove this copy of business configuration from the frontend.
- **A temporary tunnel is for testing.** Use a stable HTTPS deployment with deliberate allowed origins before relying on this app with real client records.

## 12. A Practical Way to Read the Code

Follow a single feature across the layers. For example, to understand adding a case:

1. Start at the `/cases/new` route in `src/main.jsx`.
2. Read `src/pages/NewCasePage.jsx` for data loading, controlled form state, validation, and navigation.
3. Read `createCase` in `src/api/casesApi.js` for the endpoint and payload.
4. Read `apiRequest` and `expectJson` in `src/api/client.js` for token and response handling.
5. Compare the payload field names with the Flask API contract and follow the backend endpoint to see how it validates and persists the record.

For login, start at `LoginPage`, then follow `useAuth` to `AuthProvider`, then `authApi.login`, and finally `apiRequest`. For editing a client, start at the `ClientDetailPage` route and follow its `handleSubmit` to `updateClient`.

That page-to-API-to-backend path is the central pattern used throughout this frontend.
