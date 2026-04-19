# 🐄 Shipping Cow — Next.js Edition

A production-ready Next.js port of the Shipping Cow website with **real authentication**, **a working inquiry form that sends emails**, **package tracking**, and a **user dashboard**.

---

## ⚡ Quick Start

```bash
# 1. Install Node.js 18 or higher  →  https://nodejs.org
# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# then open .env.local in a text editor and fill in the values

# 4. Run the dev server
npm run dev

# 5. Open your browser
# http://localhost:3000
```

That's it. The site runs locally with a SQLite database (auto-created in `./data/`).

---

## 📁 What's in the box

### Pages
| Route | What it does |
|-------|-------------|
| `/` | Full homepage — hero, pain points, guarantees, calculator, US map, pricing, services, about |
| `/signup` | Create an account |
| `/login` | Log in |
| `/dashboard` | Logged-in user home — shows their inquiries & account info |
| `/inquiry` | Contact form — sends email to you + confirmation to the user |
| `/track` | Look up a package by tracking number |

### API Routes (server-side)
| Route | Purpose |
|-------|---------|
| `POST /api/auth/signup` | Create a user + sets auth cookie |
| `POST /api/auth/login` | Verify credentials + sets auth cookie |
| `POST /api/auth/logout` | Clears the auth cookie |
| `GET /api/auth/me` | Returns current logged-in user (or null) |
| `POST /api/inquiry` | Saves inquiry to DB + emails you + emails the user |
| `GET /api/track?number=X` | Looks up tracking status |

---

## 🔐 Setting up authentication

You need a **JWT_SECRET** in your `.env.local`. This signs session cookies so nobody can forge logins.

**Generate a strong secret:**

```bash
# Mac/Linux
openssl rand -base64 48

# Windows PowerShell
[Convert]::ToBase64String((1..48 | % { Get-Random -Max 256 }))
```

Paste the result into `.env.local` as `JWT_SECRET=...`.

That's the only mandatory auth setup. Passwords are hashed with bcrypt before they're stored.

---

## 📧 Setting up email (the inquiry form)

The inquiry page writes to the database AND tries to send two emails: one notifying you of the new lead, one confirming receipt to the visitor.

**To make the emails actually deliver:**

1. **Sign up free at [resend.com](https://resend.com)** — 100 emails/day on the free tier, no credit card required.

2. **For local dev / testing:** Resend gives you a pre-verified sender `onboarding@resend.dev`. Use that and you can start sending today.

3. **For production:** Add your domain at `https://resend.com/domains` and verify it with DNS records (takes ~5 min). Then use `hello@yourdomain.com` (or similar) as your From address.

4. **Create an API key** at `https://resend.com/api-keys` — copy it.

5. **Fill in `.env.local`:**

   ```
   RESEND_API_KEY=re_your_actual_key_here
   RESEND_FROM=Shipping Cow <onboarding@resend.dev>
   INQUIRY_TO_EMAIL=you@yourdomain.com
   ```

6. Restart the dev server (`Ctrl+C`, then `npm run dev` again) so it picks up the new env vars.

**Test it:** Go to `/inquiry`, fill the form, submit. The email hits your inbox within seconds.

> **If email isn't configured**, the inquiry still saves to the database — you just won't get an email about it. You can see all inquiries in the dashboard of the account that submitted them, or query the DB directly.

---

## 📦 Package tracking

Three demo tracking numbers are seeded automatically on first run:

- `SC123456789` — Out for delivery
- `SC987654321` — In transit
- `SC111222333` — Delivered

Try them on `/track`. Other numbers return a friendly "not found" message.

In production, you'd connect this to a real carrier API (FedEx, UPS, ShipStation, etc.) — the lookup happens in `app/api/track/route.ts`.

---

## 🚀 Deploying to production

### Easiest: Vercel (free, one-click)

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), click "New Project", import your repo.
3. In the project settings → Environment Variables, paste in everything from your `.env.local` (JWT_SECRET, RESEND_API_KEY, RESEND_FROM, INQUIRY_TO_EMAIL).
4. Click Deploy. Live in ~90 seconds.

⚠️ **One catch with Vercel**: the SQLite file is stored on ephemeral disk, so data resets on every deploy. For production, swap to a hosted DB. Easiest options:
- **Vercel Postgres** (free tier, integrated)
- **Turso** (SQLite in the cloud — minimal code change since we're already using SQLite)
- **Supabase** (Postgres + auth as-a-service)

Tell me which one you want and I'll migrate `lib/db.ts` for you.

### Alternative: Railway / Render
Both deploy Next.js apps easily and give you persistent disk for SQLite (so you can keep using it as-is). Sign up, connect your repo, add env vars, deploy.

### Alternative: Your own VPS
Standard Next.js deploy — `npm run build && npm run start` behind nginx/Caddy. Reach out if you go this route.

---

## 🗂 Project structure

```
shippingcow-nextjs/
├── app/                      # Next.js App Router pages & API
│   ├── api/                  # Server endpoints (auth, inquiry, track)
│   ├── dashboard/page.tsx    # Logged-in user home
│   ├── inquiry/page.tsx      # Contact form
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── track/page.tsx
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout (nav + footer)
│   └── globals.css           # Brand design system
├── components/               # Reusable UI pieces
│   ├── Nav.tsx               # User-aware navigation
│   ├── Footer.tsx
│   ├── HeroTracker.tsx       # Tracking widget on homepage
│   ├── ShrinkageCalculator.tsx
│   ├── PricingToggle.tsx
│   └── USMap.tsx
├── lib/                      # Server-side utilities
│   ├── db.ts                 # SQLite setup + query helpers
│   ├── auth.ts               # Password hashing + JWT sessions
│   └── email.ts              # Resend email sending
├── public/images/
│   └── cow-logo.png          # Your mascot
├── data/                     # (auto-created) SQLite DB lives here
├── .env.example              # Template — copy to .env.local
├── package.json
└── README.md                 # This file
```

---

## 🛠 Common tasks

### Add a new page
Create `app/my-page/page.tsx`. It's live at `/my-page` instantly. Use existing components from `components/` to keep the brand consistent.

### Add a new form field to the inquiry form
1. Add the field to the `form` state in `app/inquiry/page.tsx`
2. Add the column to the `inquiries` table in `lib/db.ts`
3. Add it to the `schema` in `app/api/inquiry/route.ts`
4. Add it to the email HTML in `lib/email.ts`

### See all inquiries in the database
Install a SQLite viewer (e.g., [DB Browser for SQLite](https://sqlitebrowser.org)) and open `./data/shippingcow.sqlite`.

Or query from the terminal:

```bash
sqlite3 ./data/shippingcow.sqlite "SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 10;"
```

### Change a color / style
Everything brand-related lives in CSS variables at the top of `app/globals.css`. Edit once, applies everywhere.

---

## ⚠️ Before going public

- [ ] Change `JWT_SECRET` from any example value to a real random one
- [ ] Set up your Resend domain (don't ship with `onboarding@resend.dev` in production)
- [ ] Migrate from SQLite to a hosted DB (see deploy section)
- [ ] Add rate limiting to `/api/auth/login` and `/api/inquiry` (e.g., Upstash Ratelimit)
- [ ] Add `robots.txt` and real `canonical` URLs
- [ ] Point your actual domain at the deployment

---

## 🆘 Troubleshooting

**`npm install` fails with native-module errors on better-sqlite3:**
You need Node 18+. On Mac: `brew install node`. On Windows: install from nodejs.org.

**I submit the inquiry form and no email arrives:**
Check the terminal where `npm run dev` is running. Email errors are logged there (e.g., "RESEND_API_KEY not configured"). Fix the env var, restart the server.

**I get `JWT_SECRET` warnings:**
You're using the fallback dev secret. Create a real one (see Authentication section) and put it in `.env.local`.

**Login works but dashboard redirects to /login:**
Your cookie isn't being set. Usually means you're running on a different origin than your browser is requesting. Make sure you're at `http://localhost:3000` exactly.

---

## 📮 Want to extend this?

Claude (here or via Claude Code) can add features on top of this scaffold. Common next steps merchants ask for:

- Admin dashboard to view all inquiries (across all users)
- Stripe integration for the pricing tiers
- Real shipping rate API (FedEx/UPS) replacing the mock tracking
- Email newsletter signup with double-opt-in
- Blog with MDX
- Password reset flow

Just describe what you want.

— Moo's honor. 🐄
