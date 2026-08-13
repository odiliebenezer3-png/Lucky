# Jokky — CapCut Tutorial Site (with admin backend)

A one-page site: public tutorial feed + an admin login for creating,
editing, and publishing/unpublishing tutorial posts. Posts are stored in
a SQLite database file, no external DB service needed.

## Structure

```
capcut-site/
  server/
    server.js        <- Express API + serves the frontend
    seed-admin.js     <- creates/resets your admin login
    package.json
    .env.example
  public/
    index.html        <- the entire frontend (public feed + admin dashboard)
```

## Run it locally

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to a long random string (this signs admin
login sessions — keep it secret, never commit it).

Create your admin account:

```bash
node seed-admin.js yourusername "a-strong-password-16-chars-min"
```

Start the server:

```bash
npm start
```

Visit `http://localhost:3000` for the public site, and
`http://localhost:3000/#/admin` to log in and manage posts.

## Deploying

This is a normal Node.js app (Express + SQLite), so it needs a host that
runs a persistent Node process — **not** Netlify's static/Drop hosting,
which only serves flat files. Good fits once you've picked a host:

- **Render / Railway / Fly.io** — connect the repo, set `JWT_SECRET` as
  an environment variable, run `npm start`. All have free/cheap tiers.
- **A VPS (e.g. DigitalOcean, Hetzner)** — run it behind `pm2` or as a
  systemd service, put Nginx in front for HTTPS.

Whichever you land on, run `node seed-admin.js` once on the server to
create your login, and make sure the `.env` file (with a real
`JWT_SECRET`) is set up there too — don't reuse a value you tested
locally in a public repo.

If you specifically want to stay on Netlify, the whole backend would
need to move to Netlify Functions + a hosted database (e.g. Neon or
Turso) instead of this SQLite setup — let me know if you'd rather go
that route and I'll adapt it.

## How the admin panel works

- `/#/admin` shows a login form if you're logged out, or the post
  dashboard if you're logged in.
- New posts default to **Draft** — they won't appear on the public feed
  until you check "Published."
- Editing a post's title regenerates its URL slug.
- The login session (JWT) lasts 12 hours, then you'll need to log in
  again.

## Security notes

- Passwords are hashed with bcrypt — never stored in plain text.
- Change `JWT_SECRET` before deploying; don't use the example value.
- There's currently one admin account. If you want multiple admins 