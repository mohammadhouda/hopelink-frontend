# Hope Link — Frontend

A multi-portal Next.js application for the **Hope Link** NGO platform. Three portals — Admin, Charity, and User — run within a single Next.js instance under path prefixes. A middleware layer will transparently rewrite subdomains to these prefixes when a production domain is available.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Portal Overview](#portal-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Admin Portal](#admin-portal)
- [Charity Portal](#charity-portal)
- [Authentication & Security](#authentication--security)
- [Real-time Chat](#real-time-chat)
- [Components](#components)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| HTTP Client | Axios (with token-refresh interceptor) |
| Real-time | Socket.io Client |
| Charts | Recharts |
| Icons | Heroicons v2 |
| State | React Context API |
| Font | Inter (@fontsource/inter) |
| Linting | ESLint (eslint-config-next) |

---

## Portal Overview

| Portal | Path Prefix | Login Route | Status |
|---|---|---|---|
| Admin | `/admin/...` | `/login` | Complete |
| Charity | `/charity/...` | `/charity/login` | Complete |
| User | `/user/...` | — | Skeleton |

Each portal has its own auth context, Axios instance, protected route guard, sidebar, and navbar. The login pages are intentionally isolated from their portal's layout so the auth guard never wraps them.

---

## Project Structure

```
admin-frontend/
├── app/
│   ├── (public)/                   # Admin login  →  /login
│   │   └── login/page.tsx
│   ├── (charity-public)/           # Charity login  →  /charity/login
│   │   └── charity/login/page.tsx
│   │
│   ├── admin/                      # Admin portal  →  /admin/...
│   │   ├── layout.tsx              # UserProvider + ProtectedRoute + Sidebar + Navbar
│   │   ├── dashboard/
│   │   ├── ngo/[id]/
│   │   ├── users/[id]/
│   │   ├── requests/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── profile/
│   │   └── settings/               # page.tsx + 6 sub-component files
│   │
│   ├── charity/                    # Charity portal  →  /charity/...
│   │   ├── layout.tsx              # CharityProvider + ProtectedCharityRoute + Sidebar + Navbar
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── projects/[id]/
│   │   ├── opportunities/[id]/
│   │   ├── applications/
│   │   ├── ratings/
│   │   ├── certificates/
│   │   └── rooms/[opportunityId]/
│   │
│   ├── user/                       # User portal (skeleton)
│   ├── globals.css
│   └── layout.tsx                  # Root layout (Inter font, metadata)
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # Admin top navbar
│   │   └── Sidebar.tsx             # Admin sidebar
│   ├── charity/
│   │   ├── CharityNavbar.tsx       # Charity top navbar
│   │   ├── CharitySidebar.tsx      # Charity sidebar
│   │   └── ProtectedCharityRoute.tsx
│   ├── ConfirmModal.tsx
│   ├── CustomDatePicker.tsx
│   ├── CustomDropdown.tsx
│   ├── Fileuploader.tsx
│   ├── ProtectedRoute.tsx
│   └── logo.tsx
│
├── context/
│   ├── UserContext.tsx             # Admin auth state
│   └── CharityContext.tsx          # Charity auth state
│
├── lib/
│   ├── axios.ts                    # Admin Axios instance (redirects → /login)
│   └── charityAxios.ts             # Charity Axios instance (redirects → /charity/login)
│
└── public/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of the Hope Link backend API

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd admin-frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/admin/dashboard`.

---

## Environment Variables

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Supabase project URL (used for avatar / logo CDN)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL for all backend API calls |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL for media storage |

---

## Available Scripts

```bash
npm run dev      # Development server with hot reload  →  :3000
npm run build    # Production build
npm start        # Start production server (after build)
npm run lint     # ESLint
```

---

## Admin Portal

**Login:** `/login` — dark slate split-panel design

### Features

**Dashboard**
- KPI cards: pending requests, active users, active projects
- Registration trends line chart (7 months)
- NGOs by city bar chart
- Pending actions table with quick-review shortcuts
- Recent decisions feed

**NGO / Charity Management**
- Paginated list with search, status, category, and city filters
- Add / edit charity organizations
- Individual charity profile with project listings
- Status management (active / suspended / pending)

**User Management**
- Paginated user list with search and multi-filter
- Add / edit users with role assignment
- Individual user detail and activity history
- Delete with confirmation

**Request Management**
- Tabbed view: Registration Requests / Verification Requests
- Inline document review
- Approve or decline with reviewer notes

**Notifications**
- Full notification feed with type filters
- Mark individual or all as read, delete
- Unread badge counter in navbar (polled every 30s)
- Notifications are scoped per user — admin notifications are never visible in the charity portal

**Reports & Analytics**
- Registration trends, NGO distribution, user analytics, project stats
- Multiple chart types via Recharts
- CSV export

**Profile & Settings**
- Edit personal info, change password, upload avatar
- Settings modules: Platform, Roles & Permissions, Security, Email Templates, Audit Log, API & Integrations

### Admin Routes

| Route | Description |
|---|---|
| `/login` | Admin sign-in |
| `/admin/dashboard` | Metrics and overview |
| `/admin/ngo` | NGO listing |
| `/admin/ngo/[id]` | NGO detail |
| `/admin/users` | User listing |
| `/admin/users/[id]` | User detail |
| `/admin/requests` | Request review |
| `/admin/notifications` | Notification center |
| `/admin/reports` | Analytics |
| `/admin/profile` | Profile settings |
| `/admin/settings` | Platform configuration |

---

## Charity Portal

**Login:** `/charity/login` — dark emerald/teal gradient centered-card design (distinct from admin)

### Features

**Dashboard**
- KPI cards: total volunteers, active opportunities, pending applications, certificates issued
- Average rating summary
- Applications trend line chart
- Opportunities by status bar chart
- Recent applications table

**Projects** — `/charity/projects`, `/charity/projects/[id]`
- Full CRUD with inline modal
- Project detail page showing only opportunities linked to that project
- "New Opportunity" button on the detail page navigates to `/charity/opportunities?projectId=X`, pre-filling the project in the create form

**Opportunities** — `/charity/opportunities`, `/charity/opportunities/[id]`
- Create, edit, delete, and end opportunities
- Optional project assignment — opportunities can be linked to a project via the `projectId` field
- When opened with `?projectId=X` in the URL, the create form opens automatically with that project pre-selected
- Per-opportunity application review (approve / decline with optional reason)
- Auto-creates a volunteer chat room on first approval

**Applications** — `/charity/applications`
- Filterable by status (Pending / Approved / Declined) and opportunity
- Bulk review from a single page

**Ratings** — `/charity/ratings`
- Rate volunteers (1–5 stars) after an opportunity has ended
- Only available for approved volunteers of ended opportunities
- Running average display

**Certificates** — `/charity/certificates`
- Issue certificates to individual volunteers
- Bulk-issue to all approved volunteers for an ended opportunity

**Chat Rooms** — `/charity/rooms`, `/charity/rooms/[opportunityId]`
- Rooms auto-created on first application approval, auto-closed when opportunity ends
- Active / closed room list with last-message preview
- Real-time messaging (Socket.io), typing indicators, paginated message history
- Collapsible members panel, manual close room action

### Charity Routes

| Route | Description |
|---|---|
| `/charity/login` | Charity sign-in |
| `/charity/dashboard` | Analytics overview |
| `/charity/profile` | Charity profile edit |
| `/charity/projects` | Project list and CRUD |
| `/charity/projects/[id]` | Project detail |
| `/charity/opportunities` | Opportunity list and CRUD |
| `/charity/opportunities/[id]` | Opportunity detail + application review |
| `/charity/applications` | All applications with filters |
| `/charity/ratings` | Volunteer ratings |
| `/charity/certificates` | Certificate management |
| `/charity/rooms` | Chat room list |
| `/charity/rooms/[opportunityId]` | Real-time chat room |

---

## Authentication & Security

Both portals use **HttpOnly cookie** sessions.

**Flow:**
1. `POST /api/auth/login` → backend sets an `access_token` HttpOnly cookie
2. `ProtectedRoute` / `ProtectedCharityRoute` reads the session via the profile endpoint and redirects to the portal's login page if unauthenticated
3. Each portal's Axios instance has a **response interceptor** that:
   - Catches `401 Unauthorized`
   - Attempts a silent refresh via `POST /api/auth/refresh`
   - Queues concurrent failed requests and replays them on success
   - Redirects to the portal's own login page if refresh fails
4. `POST /api/auth/logout` clears the cookie server-side

**Route isolation:** Login pages live in separate route groups (`(public)`, `(charity-public)`) so the portal layout — and its auth guard — never wraps them.

---

## Real-time Chat

The charity rooms feature uses **Socket.io** for real-time communication.

**Connection:**
```
Auth: JWT token via socket.handshake.auth.token
      (fetched from GET /api/auth/socket-token)
Transport: websocket
```

**Client → Server events:**

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ opportunityId }` | Join the room on connect |
| `send_message` | `{ opportunityId, content }` | Send a message |
| `leave_room` | `{ opportunityId }` | Leave the room |
| `typing` | `{ opportunityId }` | Broadcast typing indicator |

**Server → Client events:**

| Event | Payload | Description |
|---|---|---|
| `new_message` | Message object | New message received |
| `user_joined` | `{ userId, name }` | A member joined |
| `user_left` | `{ userId, name }` | A member left |
| `user_typing` | `{ userId, name }` | Typing indicator (clears after 3s) |
| `error` | `{ message }` | Error from server |

---

## Components

### Shared

| Component | Description |
|---|---|
| `ConfirmModal` | Generic confirmation dialog for destructive actions |
| `CustomDropdown` | Accessible dropdown with search and multi-select |
| `CustomDatePicker` | Styled date input with calendar |
| `Fileuploader` | Drag-and-drop file upload with preview |
| `logo` | Hope Link SVG logo with gradient |

### Admin

| Component | Description |
|---|---|
| `Navbar` | Top header — notification bell with unread badge, user dropdown |
| `Sidebar` | Left nav — route highlighting, logout |
| `ProtectedRoute` | Auth guard → redirects to `/login` |

### Charity

| Component | Description |
|---|---|
| `CharityNavbar` | Top header — charity name/logo, user dropdown |
| `CharitySidebar` | Left nav — emerald theme, 8 items, logout |
| `ProtectedCharityRoute` | Auth guard → redirects to `/charity/login` |
