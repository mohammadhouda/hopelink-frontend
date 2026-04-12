# Hope Link — Frontend

A multi-portal Next.js 15 application for the **Hope Link** NGO platform. Admin, Charity, and User portals run within a single Next.js instance under path prefixes — each with its own auth context, layout, and Axios instance.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| HTTP | Axios (with silent-refresh interceptor) |
| Real-time | Socket.io Client |
| Charts | Recharts |
| Icons | Heroicons v2 |
| State | React Context API |
| Font | Inter |

---

## Portal Overview

| Portal | Path prefix | Login route | Theme |
|---|---|---|---|
| Admin | `/admin/...` | `/login` | Slate / gray |
| Charity | `/charity/...` | `/charity/login` | Emerald / teal |
| User | `/user/...` | `/user/login` | Violet / purple |

Each portal has its own: layout, auth context, Axios instance, protected route guard, sidebar, and navbar. Login pages live in isolated route groups so the portal layout — and its auth guard — never wraps them.

---

## Project Structure

```
hopelink-frontend/
├── app/
│   ├── (public)/                    # Admin login  →  /login
│   ├── (charity-public)/            # Charity login  →  /charity/login
│   ├── (user-public)/               # User login/register  →  /user/login
│   │
│   ├── admin/                       # Admin portal  →  /admin/...
│   │   ├── layout.tsx               # UserProvider + ProtectedRoute + Sidebar + Navbar
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
    ├── axios.ts            Admin Axios (redirects → /login on 401)
    ├── charityAxios.ts     Charity Axios (redirects → /charity/login on 401)
    ├── userAxios.ts        User Axios (redirects → /user/login on 401)
    └── avatarUrl.ts        getAvatarUrl() — resolves paths to CDN URLs
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Running instance of the Hope Link backend API

### Installation

```bash
git clone <repository-url>
cd hopelink-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Pages

### Admin  `/admin/...`

| Route | Description |
|---|---|
| `/login` | Admin sign-in |
| `/admin/dashboard` | KPI cards, charts, pending actions |
| `/admin/ngo` · `[id]` | Charity list and detail |
| `/admin/users` · `[id]` | User management |
| `/admin/requests` | Registration and verification request review |
| `/admin/reports` | Analytics with Recharts |
| `/admin/notifications` | Notification center |
| `/admin/profile` | Personal settings |
| `/admin/settings` | Platform config, roles, email templates, API keys, audit log |

### Charity  `/charity/...`

| Route | Description |
|---|---|
| `/charity/login` | Charity sign-in |
| `/charity/dashboard` | KPI cards, applications trend, opportunity status chart |
| `/charity/profile` | Name, logo, description, contact info |
| `/charity/projects` · `[id]` | Project CRUD, project detail with linked opportunities |
| `/charity/opportunities` · `[id]` | Opportunity CRUD, per-opportunity application review |
| `/charity/applications` | All applications — filter by status, opportunity, date |
| `/charity/ratings` | Rate volunteers (star picker, 1–5, ENDED opps only) |
| `/charity/certificates` | Issue individual or bulk certificates |
| `/charity/volunteers` | Approved volunteer roster with profile drawer |
| `/charity/rooms` · `[opportunityId]` | Real-time chat room list and detail |
| `/charity/feed` | Community feed — post project updates, like, comment |

### User  `/user/...`

| Route | Description |
|---|---|
| `/user/login` · `/register` | User auth |
| `/user/dashboard` | Stats, recent activity |
| `/user/profile` | Personal info, volunteer preferences, skills, experience history, ratings received |
| `/user/opportunities` · `[id]` | Browse and apply — opportunities ordered by pre-computed match score when profile is complete; `MatchBadge` shows fit tier on each card |
| `/user/applications` | Application history with statuses |
| `/user/recommendations` | AI-matched top opportunities |
| `/user/certificates` | Earned certificates |
| `/user/rooms` · `[opportunityId]` | Real-time volunteer chat |
| `/user/notifications` | Notification feed |
| `/user/feed` | Community feed — share certificates and updates |

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

The score itself is computed in the background by the API's BullMQ worker and stored in the `VolunteerMatchScore` table. The frontend simply reads the `matchScore` field returned per opportunity — no client-side calculation involved.

### `NotificationBell`

Polls `GET /notifications/unread-count` every 30 seconds. Renders an animated badge when there are unread items.

### `getAvatarUrl(path)`

Handles the dual storage format: seed data uses full picsum URLs, uploaded files store only the relative path. The function returns the path unchanged if it starts with `http`, otherwise prepends the Supabase CDN base URL.

```ts
export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
}
```

---

## Authentication

All three portals use **HttpOnly cookie** sessions set by the backend.

**Flow:**
1. `POST /api/auth/login` → backend sets `access_token` HttpOnly cookie
2. The portal's `ProtectedRoute` reads the session via its profile endpoint; unauthenticated users are redirected to the portal's own login page
3. On `POST /api/auth/logout` the cookie is cleared server-side

---

## Real-time Chat

Volunteer rooms use Socket.io.

```js
// Connection uses a separate non-HttpOnly token for Socket.io handshake
const socket = io(API_URL, { auth: { token } });

socket.emit("join_room", { opportunityId });
socket.on("new_message", (msg) => { /* render */ });
socket.emit("send_message", { content });
socket.emit("typing", { opportunityId });
```

Rooms are created on the first application approval and closed automatically when the opportunity ends. Closed rooms reject new messages and joins.

---

## A Hard Problem We Solved

### Silent Token Refresh With Concurrent Requests

**The situation:** The backend issues a short-lived (20-minute) access token as an HttpOnly cookie. When it expires, a silent `POST /api/auth/refresh` is needed to rotate the pair. This is straightforward for a single request, but in a real app multiple requests can be in-flight at the same time when the token expires — for example, the dashboard simultaneously fetches stats, notifications, and recent activity on mount.

**Why it was tricky:** If all three fail with `401` and each one independently fires a refresh, two of them will see a **revoked token** — because the backend uses family-based rotation, meaning the first refresh immediately invalidates the old token. The second and third refresh calls fail, the interceptor gives up, and the user is logged out for no reason.

**The solution — a request queue:** Each Axios instance (admin, charity, user) maintains a module-level flag and a queue:

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
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then(() => axiosInstance(error.config));
    }

    isRefreshing = true;
    try {
      await axios.post("/api/auth/refresh", {}, { withCredentials: true });
      processQueue(null);
      return axiosInstance(error.config);  // replay original request
    } catch (err) {
      processQueue(err);
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
```

This pattern guarantees exactly one refresh per expiry cycle regardless of how many concurrent requests are in flight — matching the backend's expectation of a single rotation per token family.
