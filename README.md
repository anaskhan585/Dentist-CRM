# Vive Dental Clinic — Practice CRM

A practice-management CRM for dental clinics, built on the MERN stack. It covers
the working day of a clinic: the diary, patient files, clinical notes, lab work,
billing and reporting.

The navigation deliberately mirrors the practice's previous system — same tabs,
same order — so nobody has to relearn where anything lives.

---

## Getting started

**New to Node projects?** Follow [SETUP.md](SETUP.md) instead — it walks through
installing Node, getting a free database and running the app, step by step.

**Requirements:** Node 18.18+ and a MongoDB instance (local, or a MongoDB Atlas
connection string).

```bash
# 1. install the root tooling and both workspaces
npm install

# 2. configure the API
cp server/.env.example server/.env      # then set MONGODB_URI and JWT_SECRET

# 3. load the demo clinic (64 patients, a full diary, lab cases, invoices)
npm run seed

# 4. run the API (:5000) and the front end (:5173) together
npm run dev
```

Open http://localhost:5173 and sign in with the seeded administrator:

```
olivia@vive.dental  /  ViveDental@2024
```

Every seeded account uses the same password. `npm run seed -- --keep` only seeds
when the database is empty, which is useful in a deploy hook.

### Production

```bash
npm run build     # builds the client into client/dist
NODE_ENV=production npm start
```

In production the API serves the built front end from the same origin, so a
single process is all you need to deploy.

---

## What's in it

| Screen | What it does |
|---|---|
| **Dashboard** | Today's list, collections and chair-activity charts, and what needs chasing |
| **Appointments** | Chair-by-chair day view with a live "now" line, plus a filterable list view. Double-booking a clinician is rejected server-side |
| **Patients** | Searchable file index; each file carries history, an interactive dental chart, records, invoices and lab work |
| **Health Records** | SOAP-structured clinical notes (complaint, findings, diagnosis, treatment, plan) with prescriptions |
| **Lab Tracking** | Drag-and-drop board from impression through fabrication to fitting, with overdue flags |
| **Users** | Team members, roles, diary colours and working hours |
| **Messages** | Internal notes plus patient WhatsApp/SMS/email threads |
| **Preferences** | Clinic details, scheduling, notifications, billing, and your own password |
| **Reports** | Collections, treatment mix, clinician workload, payment split, CSV export |

Invoices are reachable from the topbar **New** menu, a patient's Billing tab, and
the Reports screen — matching how the practice raised them before.

### Dental charting

The patient file includes an odontogram in **FDI notation**, drawn from the
clinician's viewpoint (patient's right on the left of the screen). Any tooth can
be marked caries / filled / crown / root canal / implant / missing / watch, with
the affected surfaces (M, O, D, B, L) and a note.

---

## How it's built

```
server/                Express + Mongoose API
  src/models/          User, Patient, Appointment, HealthRecord, LabCase, Invoice, Message, Settings
  src/controllers/     Request handling, zod validation schemas
  src/routes/          Route tables with role guards
  src/middleware/      JWT auth, role authorisation, validation, error handling
  src/seed/            Deterministic demo clinic

client/                React 18 + Vite
  src/components/      UI primitives, layout, forms, hand-built SVG charts
  src/pages/           One file per screen
  src/lib/             API client, auth context, formatting, icons
  src/styles/          Design tokens, then base / layout / components / pages
```

**Auth** is JWT, sent as a bearer token and mirrored into an httpOnly cookie.
Roles are `admin`, `dentist`, `hygienist` and `receptionist`; charting and
clinical notes are limited to clinicians, and practice settings to admins. A
clinical record can only be revised by its author or an admin.

**Performance.** Routes are code-split, so the shell and today's list paint
before the rest arrives (~110 KB gzipped on first load). The two fonts are
self-hosted variable woff2 (94 KB total) and preloaded, so there's no
render-blocking request to a font CDN. Charts are hand-built SVG rather than a
charting library. List endpoints are paginated and indexed.

**Deleting is avoided.** Patients archive, invoices void, and team members
deactivate — clinical and financial history stays intact.

---

## Design notes

The palette comes from the clinic's own website: the teal of the logo
(`#0f6b7a`) carries the brand, the site's pale blue (`#eaf3f9`) is the canvas,
and the gold from the clinic interior is held back for things that genuinely
need attention. Type is **Archivo** for headings and metric figures and
**Plus Jakarta Sans** for the interface, both self-hosted as variable woff2.

The supplied logos live in `client/public/brand/` — the white wordmark is used
on the teal sidebar and sign-in panel, and the square "v" mark (`favicon.svg`,
mirrored as a component in `Sidebar.jsx`) is used in the collapsed rail and the
browser tab.

Chart series colours are a separate, brighter set from the UI palette: the UI
greens are deliberately dark and low-chroma, which fails colour-blind separation
once they become data marks. The series order in `tokens.css` was validated for
CVD separation, lightness and contrast — **do not reorder it**, the ordering is
what keeps adjacent pairs distinguishable.

### Sidebar

Collapses to an icon rail with hover tooltips; the state persists across
sessions. Toggle it with the edge control or the `[` key. Below 1024px it
becomes a drawer instead. `⌘K` / `Ctrl-K` jumps to patient search from anywhere.
