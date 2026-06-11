# Hope Link — Frontend

The web application for the Hope Link NGO platform. Three separate portals — Admin, Charity, and Volunteer — in a single Next.js app, each with its own login, dashboard, and set of features.

For architecture details, component internals, and engineering decisions, see [TECHNICAL.md](TECHNICAL.md).

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Portals](#portals)
3. [Pages](#pages)
   - [Public](#public)
   - [Admin](#admin)
   - [Charity](#charity)
   - [Volunteer](#volunteer)
4. [Getting Started](#getting-started)
5. [Real-time Chat](#real-time-chat)

---

## What Is This?

The Hope Link frontend is the web interface where admins, charities, and volunteers log in and use the platform. It connects to the Hope Link backend API.

---

## Portals

| Portal | Web address | Theme |
|---|---|---|
| Admin | `/admin/...` | Slate / gray |
| Charity | `/charity/...` | Emerald / teal |
| Volunteer | `/user/...` | Violet / purple |

Each portal has its own login page, dashboard, sidebar, and navigation. You cannot access one portal's pages while logged in to another.

---

## Pages

### Public

| Route | Description |
|---|---|
| `/` | Landing page — platform overview, live stats, how it works, and call to action |
| `/charity/register` | NGO registration request form (no login required) |

### Admin

| Route | Description |
|---|---|
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | KPI cards, charts, pending actions |
| `/admin/ngo` · `[id]` | Charity list and detail pages |
| `/admin/users` · `[id]` | User management |
| `/admin/requests` | Registration and verification request review |
| `/admin/reports` | Analytics charts |
| `/admin/notifications` | Notification center |
| `/admin/profile` | Personal settings |
| `/admin/settings` | Platform config, email templates, API keys, audit log |

### Charity

| Route | Description |
|---|---|
| `/charity/login` | Charity sign-in |
| `/charity/dashboard` | Stats, application trends, opportunity status chart |
| `/charity/profile` | Name, logo, description, contact info |
| `/charity/projects` · `[id]` | Project management and detail with linked opportunities |
| `/charity/opportunities` · `[id]` | Post and manage volunteering opportunities |
| `/charity/applications` | Review all applications — filter by status, opportunity, date |
| `/charity/ratings` | Rate volunteers after opportunities end (1–5 stars) |
| `/charity/certificates` | Issue certificates individually or in bulk |
| `/charity/volunteers` | Approved volunteer roster with profile drawer |
| `/charity/rooms` · `[opportunityId]` | Real-time chat room list and detail |
| `/charity/feed` | Community feed — post updates, like, comment |

### Volunteer

| Route | Description |
|---|---|
| `/user/login` · `/user/register` | Volunteer sign-in and registration |
| `/user/dashboard` | Stats and recent activity |
| `/user/profile` | Personal info, skills, preferences, experience, and ratings received |
| `/user/opportunities` · `[id]` | Browse and apply — opportunities ranked by match score when profile is complete |
| `/user/applications` | Application history with statuses |
| `/user/recommendations` | Top matched opportunities |
| `/user/certificates` | Earned certificates |
| `/user/rooms` · `[opportunityId]` | Real-time volunteer chat rooms |
| `/user/notifications` | Notification feed |
| `/user/feed` | Community feed — share certificates and updates |

---

## Getting Started

**Prerequisites:**
- Node.js 18+
- A running instance of the Hope Link backend API

**Install and run:**

```bash
git clone <repository-url>
cd hopelink-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Environment variables** — create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Real-time Chat

Volunteers and charities communicate through real-time chat rooms tied to each opportunity. Rooms open automatically when the first application is approved and close when the opportunity ends. Closed rooms reject new messages and new joins.
