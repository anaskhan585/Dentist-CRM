# Setup guide

A first-run guide for someone who has never run a Node project before. Follow
the steps in order — each takes a few minutes.

---

## Step 1 — Install Node.js

1. Go to <https://nodejs.org> and install the **LTS** version (accept defaults)
2. Close the terminal, open a new one, then check:

```bash
node -v      # must print v18.18.0 or higher
npm -v
```

> **Terminal**: on Windows use *PowerShell*, or the terminal built into VS Code.
> On macOS use *Terminal*.

---

## Step 2 — Install Git

Download from <https://git-scm.com/downloads>, install with the defaults,
reopen the terminal, then check:

```bash
git --version
```

---

## Step 3 — Get the project

From GitHub:

```bash
git clone https://github.com/anaskhan585/Dentist-CRM.git
cd Dentist-CRM
```

Or, if you were sent a `.bundle` file, put it somewhere easy and run:

```bash
git clone the-file-you-were-sent.bundle Dentist-CRM
cd Dentist-CRM
```

Confirm you are in the right place — this should list `client`, `server` and
`package.json`:

```bash
ls        # Windows PowerShell: dir
```

---

## Step 4 — Get a database (MongoDB Atlas, free)

The CRM stores everything in MongoDB. Atlas is a free cloud database with
nothing to install.

1. Sign up at <https://www.mongodb.com/cloud/atlas/register>
2. Create a cluster on the **free M0** tier
3. **Database Access** → *Add New Database User* → set a username and a password
   of **letters and numbers only** → role *Read and write to any database*
   → Add User. **Write the password down.**
4. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   (`0.0.0.0/0`) → **Confirm**. Wait until the status reads `Active`.
5. **Database** → *Connect* → *Drivers* → copy the connection string

Then edit the string:

- replace `<db_password>` with the real password
- add the database name `dentist-crm` straight after `.net/`

```
mongodb+srv://myuser:MyPassword123@cluster0.ab1cd.mongodb.net/dentist-crm?retryWrites=true&w=majority
```

> If your internet provider's DNS cannot resolve the `mongodb+srv://` address
> (you would see `querySrv ECONNREFUSED`), either switch your DNS to `8.8.8.8`,
> or on the Atlas *Drivers* screen turn **off** the "SRV Connection String"
> toggle and use the longer `mongodb://` string it shows instead.

---

## Step 5 — Create the settings file

```bash
cd server
cp .env.example .env      # Windows CMD: copy .env.example .env
cd ..
```

Open `server/.env` and set two values:

```env
MONGODB_URI=mongodb+srv://myuser:MyPassword123@cluster0.ab1cd.mongodb.net/dentist-crm
JWT_SECRET=any-long-random-text-you-invent-at-least-30-characters
```

Keep `MONGODB_URI` on a single line. Leave the rest as it is. This file is
already in `.gitignore` and must never be committed.

---

## Step 6 — Install the dependencies

From the project root:

```bash
npm install
```

This installs the root tooling and both the `server` and `client` workspaces.
It takes a few minutes. Warnings are fine; only red `ERR!` lines matter.

---

## Step 7 — Load the demo clinic

```bash
npm run seed
```

This loads a small demo practice: 5 team members, 5 patients, and enough
appointments, records, lab cases and invoices for every screen to have
something real on it.

> ⚠️ `npm run seed` **wipes the database first**. Once you start entering real
> patients, do not run it again. Use `npm run seed -- --keep` if you only want
> to seed a database that is still empty.

---

## Step 8 — Run it

```bash
npm run dev
```

- API → <http://localhost:5000>
- App → <http://localhost:5173>

Open **<http://localhost:5173>** and sign in:

```
Email:    olivia@vive.dental
Password: ViveDental@2024
```

Stop the servers with **Ctrl + C**. Next time, only Step 8 is needed.

---

## Step 9 — Make it the clinic's own

1. **Preferences → Clinic details** — name, phone, address, currency symbol
2. **Preferences → Scheduling** — opening hours, chairs, slot length
3. **Users** — add the real clinicians and front-desk staff
4. **Preferences → My account** — change your own name, email and password
5. Once real accounts exist, deactivate the demo ones under **Users**

---

## If something goes wrong

| What you see | What it means | Fix |
|---|---|---|
| `node: command not found` | Node isn't installed, or the terminal is stale | Reinstall Node, open a **new** terminal |
| `bad auth : authentication failed` | Wrong Atlas username or password | Recheck step 4 |
| `querySrv ECONNREFUSED` | Your DNS can't resolve the SRV record | See the note in step 4 |
| `ECONNREFUSED` after that | IP not allowed, or the cluster is still starting | Redo Network Access in step 4 |
| `EADDRINUSE :::5000` | Something else is on port 5000 | Set `PORT=5001` in `server/.env` |
| `dubious ownership` (Windows) | The folder was made by an Administrator shell | `git config --global --add safe.directory <path>` |
| Page loads but no data | Not seeded, or the API is down | Check the terminal; run `npm run seed` |

---

## Putting it online

```bash
npm run build                    # bundles the front end into client/dist
NODE_ENV=production npm start    # one process serves the API and the app
```

On a host such as Render, Railway or a VPS:

- **Build command:** `npm install --include=dev && npm install --prefix server --include=dev && npm install --prefix client --include=dev && npm run build`
- **Start command:** `npm start`
- **Environment variables:** `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`
  (a fresh long random value) and `CLIENT_ORIGIN` set to the site's own address,
  e.g. `https://your-app.onrender.com` — with no trailing slash
- Do **not** set `PORT`; the host assigns it

The explicit `--include=dev` flags matter: with `NODE_ENV=production` some hosts
skip the build tools, and the build then fails with `vite: not found`.
