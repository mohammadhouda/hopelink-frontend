# Hope Link Frontend — Technical Reference

For the non-technical overview and setup instructions, see [README.md](README.md).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Authentication](#authentication)
   - [Portal Auth Flow](#portal-auth-flow)
   - [Admin Login Routing](#admin-login-routing)
4. [Key Components](#key-components)
   - [PostCard](#postcard)
   - [CreatePostModal](#createpostmodal)
   - [MatchBadge](#matchbadge)
   - [NotificationBell](#notificationbell)
5. [Shared Utilities](#shared-utilities)
   - [createAxiosInstance](#createaxiosinstance)
   - [lib/constants.ts](#libconstantsts)
   - [lib/dateUtils.ts](#libdateutilsts)
   - [getAvatarUrl](#getavatarurl)
6. [404 Routing](#404-routing)
7. [A Hard Problem: Silent Token Refresh With Concurrent Requests](#a-hard-problem-silent-token-refresh-with-concurrent-requests)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| HTTP | Axios (with silent-refresh interceptor) |
| Real-time | Socket.io Client |
| Charts | Recharts |
| Icons | Heroicons v2 |
| State | React Context API |
| Font | Inter |

---

## Project Structure

```
hopelink-frontend/
├── app/
│   ├── page.tsx                     # Public landing page  →  /
│   │
│   ├── (public)/                    # /login  →  redirects to /admin/login
│   ├── (charity-public)/            # Charity login + register  →  /charity/login, /charity/register
│   ├── (user-public)/               # User login/register  →  /user/login, /user/register
│   │
│   ├── admin/                       # Admin portal  →  /admin/...
│   │   ├── layout.tsx               # Conditional: bare for /admin/login, else UserProvider + ProtectedRoute + Sidebar + Navbar
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── ngo/  [id]/
│   │   ├── users/  [id]/
│   │   ├── requests/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── profile/
│   │   └── settings/
│   │
│   ├── charity/                     # Charity portal  →  /charity/...
│   │   ├── layout.tsx               # CharityProvider + ProtectedCharityRoute
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── projects/  [id]/
│   │   ├── opportunities/  [id]/
│   │   ├── applications/
│   │   ├── ratings/
│   │   ├── certificates/
│   │   ├── volunteers/
│   │   ├── rooms/  [opportunityId]/
│   │   └── feed/
│   │
│   └── user/                        # User portal  →  /user/...
│       ├── layout.tsx               # VolunteerProvider + ProtectedUserRoute
│       ├── dashboard/
│       ├── profile/
│       ├── opportunities/  [id]/
│       ├── applications/
│       ├── recommendations/
│       ├── certificates/
│       ├── rooms/  [opportunityId]/
│       ├── notifications/
│       └── feed/
│
├── components/
│   ├── layout/          Navbar, Sidebar (admin)
│   ├── charity/         CharityNavbar, CharitySidebar, ProtectedCharityRoute, Dropdown
│   ├── user/            UserNavbar, UserSidebar, ProtectedUserRoute
│   └── ui/              PostCard, CreatePostModal, NotificationBell
│
├── context/
│   ├── UserContext.tsx          Admin auth state
│   ├── CharityContext.tsx       Charity auth state
│   └── VolunteerContext.tsx     User/volunteer auth state
│
└── lib/
    ├── createAxiosInstance.ts   Factory — one interceptor impl shared by all portals
    ├── axios.ts                 Admin Axios  →  createAxiosInstance("/admin/login")
    ├── charityAxios.ts          Charity Axios  →  createAxiosInstance("/charity/login")
    ├── userAxios.ts             User Axios  →  createAxiosInstance("/user/login")
    ├── constants.ts             Shared CITY_OPTIONS, CATEGORY_OPTIONS, DAY_OPTIONS,
    │                            APPLICATION_STATUS, OPPORTUNITY_STATUS enums + helpers
    ├── dateUtils.ts             Shared date formatting helpers
    └── avatarUrl.ts             getAvatarUrl() — resolves paths to CDN URLs
```

---

## Authentication

### Portal Auth Flow

All three portals use **HttpOnly cookie** sessions set by the backend.

1. `POST /api/auth/login` → backend sets `access_token` HttpOnly cookie
2. The portal's `ProtectedRoute` reads the session via its profile endpoint; unauthenticated users are redirected to the portal's own login page
3. On `POST /api/auth/logout` the cookie is cleared server-side

### Admin Login Routing

`app/admin/layout.tsx` is a `"use client"` component that reads `usePathname()`. When the path is `/admin/login` it renders children directly, skipping `UserProvider`, `ProtectedRoute`, `Navbar`, and `Sidebar`. All other `/admin/*` routes get the full protected shell. This keeps the login page inside the `app/admin/` segment (inheriting the root layout) without creating a redirect loop.

Charity and user login pages use isolated route groups (`(charity-public)`, `(user-public)`) for the same reason.

---

## Key Components

### `PostCard`

Renders a community feed post (volunteer or charity). Handles like toggle, expandable comments, delete for own content, and supports `accent="violet"` (user) or `accent="emerald"` (charity). Avatars go through `getAvatarUrl()` to normalize stored paths and full URLs.

### `CreatePostModal`

Post composer with type selector (GENERAL / CERTIFICATE / PROJECT), optional image upload to Supabase (`?bucket=logos&folder=posts`), and character-aware textarea.

### `MatchBadge`

Displayed on each opportunity card when the backend returns `hasScores: true`. Converts the raw numeric score into a human-readable fit tier:

| Score | Label | Color |
|---|---|---|
| ≥ 8 | Great match | Emerald |
| 4 – 7 | Good match | Violet |
| 1 – 3 | Some match | Gray |

The score is computed in the background by the API's BullMQ worker and stored in the `VolunteerMatchScore` table. The frontend reads the `matchScore` field returned per opportunity — no client-side calculation involved.

### `NotificationBell`

Polls `GET /notifications/unread-count` every 30 seconds. Renders an animated badge when there are unread items.

---

## Shared Utilities

### `createAxiosInstance`

Single implementation of the silent-refresh interceptor, shared by all three portals. Each portal's axios file is a one-liner:

```ts
// lib/charityAxios.ts
import { createAxiosInstance } from "./createAxiosInstance";
const charityApi = createAxiosInstance("/charity/login");
export default charityApi;
```

The only difference between portals is `loginRedirect` — the path the interceptor navigates to on permanent refresh failure. Any fix to the interceptor logic propagates to all portals automatically.

### `lib/constants.ts`

Single source of truth for every enum that drives dropdowns, filters, and status badges across all portals.

| Export | Used for |
|---|---|
| `CITY_OPTIONS` | City dropdowns in all three portals |
| `CITY_OPTIONS_WITH_PLACEHOLDER(label)` | Dropdowns that need a "Select city…" option |
| `cityLabel(value)` | Display label for a stored city enum value |
| `CATEGORY_OPTIONS` | Category filter selects |
| `categoryLabel(value)` | Display label for a stored category enum value |
| `DAY_OPTIONS` | Availability day pickers |
| `DAY_SHORT` | Abbreviated day names ("Mon", "Tue", …) |
| `APPLICATION_STATUS` | `{ label, badge, dot }` per status — drives colored badges |
| `OPPORTUNITY_STATUS` | Same shape for opportunity status badges |

### `lib/dateUtils.ts`

Replaces 12+ local `formatDate` functions that were copy-pasted across pages.

| Function | Output example |
|---|---|
| `formatDate(date)` | `"Jan 5, 2025"` |
| `formatDateLong(date)` | `"January 5, 2025"` |
| `formatDateCompact(date)` | `"5 Jan 2025"` |
| `formatMonthYear(date)` | `"Jan 2025"` |
| `formatDateTime(date)` | `"Jan 5, 2025 · 14:30"` |
| `formatRelative(date)` | `"3 days ago"` / `"just now"` |
| `daysUntil(date)` | `12` (days from today, negative if past) |

All functions accept `string | Date` and return a formatted string. Invalid or null input returns `"—"`.

### `getAvatarUrl`

Handles the dual storage format: seed data uses full picsum URLs, uploaded files store only the relative path. Returns the path unchanged if it starts with `http`, otherwise prepends the Supabase CDN base URL.

```ts
export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
}
```

---

## 404 Routing

`app/not-found.tsx` detects the current portal from `usePathname()` and sends the user to the right place:

| URL prefix | Back button destination |
|---|---|
| `/admin/*` | `/admin/dashboard` |
| `/charity/*` | `/charity/dashboard` |
| `/user/*` | `/user/dashboard` |
| anything else | `/` (landing page) |

---

## A Hard Problem: Silent Token Refresh With Concurrent Requests

**The situation:** The backend issues a short-lived (20-minute) access token as an HttpOnly cookie. When it expires, a silent `POST /api/auth/refresh` is needed to rotate the pair. This is straightforward for a single request, but in a real app multiple requests can be in-flight at the same time when the token expires — for example, the dashboard simultaneously fetches stats, notifications, and recent activity on mount.

**Why it was tricky:** If all three fail with `401` and each one independently fires a refresh, two of them will see a **revoked token** — because the backend uses family-based rotation, meaning the first refresh immediately invalidates the old token. The second and third refresh calls fail, the interceptor gives up, and the user is logged out for no reason.

**The solution — a request queue:** The interceptor maintains a module-level flag and a queue:

```ts
let isRefreshing = false;
let queue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve("")));
  queue = [];
}
```

The response interceptor for every `401`:
- If `isRefreshing` is already `true`, the request is added to the queue as a Promise and waits
- The **first** `401` sets `isRefreshing = true` and fires the refresh
- On refresh success: `processQueue(null)` resolves every waiting request, which then replay themselves
- On refresh failure: `processQueue(err)` rejects all waiting requests and redirects to the login page

```ts
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then(() => instance(error.config));
    }

    isRefreshing = true;
    try {
      await refreshClient.post("/api/auth/refresh");
      processQueue(null);
      return instance(error.config);  // replay original request
    } catch (err) {
      processQueue(err);
      window.location.href = loginRedirect;
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
```

This pattern guarantees exactly one refresh per expiry cycle regardless of how many concurrent requests are in flight — matching the backend's expectation of a single rotation per token family.
