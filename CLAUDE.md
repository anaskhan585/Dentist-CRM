# Vive Dental Clinic — Practice CRM

Practice management for a US dental clinic: scheduling, patient files, clinical
records, lab tracking and billing. MERN, deployed as a single Node process that
also serves the built React app.

## Layout

- `client/` — React 18 + Vite 6, React Router, TanStack Query v5, hand-built SVG charts
- `server/` — Express 4, Mongoose 8, JWT auth, zod validation
- Database is MongoDB Atlas, never local in production

## Running it

```bash
npm install          # installs root, server and client
npm run dev          # client on 5173, server on 5000
npm run seed         # demo data: 5 staff, 5 patients, invoices, lab cases
```

`server/.env` is required and git-ignored; copy `server/.env.example`. Never set
`PORT` on a host that assigns one.

## Conventions

- Roles are `admin`, `dentist`, `hygienist`, `receptionist`. Billing is
  admin-only and gated on the server, not just hidden in the UI.
- Forms post through `useSaveMutation`, which surfaces zod field errors inline.
- Money, dates and names go through the helpers in `client/src/lib/format.js`.
- Design tokens live in `client/src/styles/tokens.css`. Use the `--brand*` and
  `--series-*` variables rather than literal colours.

## Things that have bitten this project

Each of these cost real debugging time. They are fixed; do not reintroduce them.

- **`.lean({ virtuals: true })` does nothing on its own.** Core Mongoose ignores
  the option, so `subtotal`/`total`/`balance` came back undefined and every
  invoice rendered as `$0`. The `mongoose-lean-virtuals` plugin is applied to
  Invoice, Patient, LabCase and Appointment. Any new schema whose virtuals are
  read from a lean query needs it too.
- **One React Query key, one response shape.** `PatientPicker` and the patient
  file page share `['patients', <id>]`. The picker once unwrapped inside
  `queryFn` and wrote a bare patient over the page's bundle, leaving the page
  reading "Patient not found" until a reload. Narrow with `select`, never by
  changing what the key caches.
- **A CORS mismatch must not throw.** Vite marks its entry script, module
  preloads, stylesheet and preloaded fonts `crossorigin`, so the browser sends
  an `Origin` when fetching them from the site's own address. Throwing turned
  each of those into a 500 and the app never started. The origin callback
  returns `callback(null, false)` instead.
- **`npm run build` must install what it needs.** Hosts install with
  `NODE_ENV=production`, which drops devDependencies and takes vite with it, and
  some offer no way to pass flags. The root build script installs both
  workspaces with `--include=dev` first.
- **Totals are derived, never stored.** An invoice's total comes from its line
  items; `reconcile()` re-derives status and the patient balance on every write.
  A zero-value invoice counts as settled, not unpaid.

## Deployment

One service: `npm run build`, then `npm start`, entry `server/src/index.js`.
In production Express serves `client/dist` and handles client-side routes.

Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`,
`CLIENT_ORIGIN` (the site's own URL). Leave `PORT` unset.

## Verifying changes

There is no test suite. Before calling something done, build the client and
exercise the actual screen — several bugs here passed a build and still shipped
broken. When a mock API stands in for MongoDB, make it match the real model's
behaviour, or it will hide exactly the bug you are looking for.
