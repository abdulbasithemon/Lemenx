# Lemenx Office

Role-based internal office web app combining **Lead Management** and **Leave Application** for three roles: **Super Admin**, **Manager**, and **Agent**.

Built with Next.js (App Router) + TypeScript + Tailwind CSS + Prisma (SQLite by default; switchable to MySQL/PostgreSQL) + JWT sessions.

## Quick Start

```bash
npm install
cp .env.example .env        # adjust secrets for production
npm run setup               # prisma generate + db push + seed
npm run dev                 # http://localhost:3000
```

Seeded Super Admin login: **admin@lemenx.com** / DOB **1990-01-01** / password **admin123** — change it after first login (login requires all three fields to match).

For production: `npm run build && npm start`.

### Switching to MySQL/PostgreSQL

1. Change `provider` in `prisma/schema.prisma` (`mysql` or `postgresql`).
2. Set `DATABASE_URL` in `.env`.
3. Run `npx prisma db push && npm run db:seed`.

## Modules

### Authentication
- Login requires **Email + Date of Birth + Password** (all three must match).
- Account states: **active**, **paused** (login blocked with "Your account is temporarily suspended. Contact administrator.").
- Password reset by Super Admin (anyone) or Manager (Agents only) — the new password is shown once on-screen.

### User Management
- Super Admin creates Managers & Agents; Managers create Agents only.
- Pause / Unpause / Delete / Reset Password from the user table. Deleting a user releases their untouched leads back to the pool.

### Lead Management
- Two menus: **Elite Special** and **Call Sheet**; every lead belongs to one.
- Super Admin uploads **CSV/XLSX** (columns: `Customer Name`, `Phone Number`, `Address`, `OG Report`). The `OG Report` text (e.g. `Total order - 2, Delivered - 2, Returned - 0`) is parsed into **Total Orders / Delivered / Returned** columns.
- Custom statuses (Super Admin): seeded with **Done, Cancel, Phone Off, No Response**; every lead starts as **Fresh**.
- **Distribution:** each logged-in Agent/Manager gets 10 unique fresh leads; when supply is short, leads split equally (120 leads / 20 users → 6 each). Assigned leads stay with their user until touched. New uploads top active users back up toward 10.
- **10 → 11 rolling window:** after status updates on 8 leads, the first 7 touched hide and 8 fresh load below (3 old + 8 new = 11). The cycle repeats every further 8 touches. Only the *first* status change marks a lead touched; statuses stay editable afterwards.
- **Re-login:** last 2 touched leads (across both menus) on top + 8 fresh below. Each menu keeps its own independent window state.
- Optional per-lead note field for agents.

### Leave Application
- One day per application; **Fridays disabled**; no past dates; max **3 days per calendar month** — exceeding it shows: **"আপনি ইতিমধ্যে ৩ দিন ছুটি নিয়েছেন এই মাসে আর সম্ভব নয়"**.
- Agent leave → decided by Manager or Super Admin; Manager leave → Super Admin only. Decisions can be changed later; approvers can attach a note.
- On decision the applicant gets a **dashboard notification** (bell) and a **WhatsApp message**.
- Every user can update their own WhatsApp number from **My Profile**.

### WhatsApp Integration
`sendWhatsAppMessage()` wrapper with retry + logging to `whatsapp_logs`. Provider selected via `WHATSAPP_PROVIDER` env:
- `mock` (default) — logs to console + DB, no external call.
- `twilio` — set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.
- `meta` — WhatsApp Business Cloud API; set `META_WA_ACCESS_TOKEN`, `META_WA_PHONE_NUMBER_ID`.

### Reports
- Manager + Super Admin: date-range report per user — total touched, per-status breakdown, Elite Special vs Call Sheet.
- Super Admin extras: **Download CSV**, **Download All Touched Leads**, and re-upload of the cleaned touched-lead file — those leads return to the Fresh pool while previous status/assignee history is preserved in `lead_reupload_log`.

## Project Layout

```
prisma/schema.prisma        # database schema + seed (prisma/seed.js)
src/middleware.ts           # JWT + role-based page protection
src/lib/                    # auth, distribution engine, OG parser, WhatsApp, reports
src/app/api/                # REST endpoints (auth, users, leads, leave, reports, ...)
src/app/dashboard/          # role-aware UI pages
```

A sample upload file is included at `sample-leads.csv`.
