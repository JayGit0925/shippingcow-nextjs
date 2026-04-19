# ShippingCow — Next.js Fulfillment Routing SaaS

ShippingCow helps e-commerce sellers reduce shipping costs by routing every order through the cheapest qualified carrier in real time. Built with Next.js 14 App Router, SQLite (dev) or Postgres (prod), Tailwind CSS, and LiteLLM for the AI chat widget.

---

## Quick start

### 1. Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** (comes with Node)

### 2. Clone and install

```bash
git clone https://github.com/your-org/shippingcow-nextjs.git
cd shippingcow-nextjs
npm install
```

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the values. Minimum required for local dev:

| Variable | What it does |
|---|---|
| `JWT_SECRET` | Signs auth cookies. Generate with `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | Used in password-reset email links. Set to `http://localhost:3000` locally |

Everything else (email, LiteLLM, admin) is optional — features degrade gracefully when not configured.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created automatically at `./data/shippingcow.sqlite` on first run.

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, pricing, social proof, FAQ |
| `/signup` | Create an account |
| `/login` | Log in |
| `/dashboard` | User dashboard — inquiries and account info |
| `/inquiry` | Lead capture / quote request form |
| `/track` | Package tracker |
| `/forgot-password` | Request a password reset link |
| `/reset-password` | Set a new password via token |
| `/admin` | Inquiry management (requires `ADMIN_EMAIL` to match logged-in user) |

---

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/signup` | POST | Create account + set session cookie |
| `/api/auth/login` | POST | Verify credentials + set session cookie |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/me` | GET | Return current user or null |
| `/api/auth/forgot-password` | POST | Generate reset token + send email |
| `/api/auth/reset-password` | POST | Validate token + update password |
| `/api/inquiry` | POST | Save inquiry + send notification emails |
| `/api/chat` | POST | Proxy chat messages through LiteLLM |
| `/api/track` | GET | Look up tracking status by number |
| `/api/tracking` | GET | Enhanced tracking endpoint (returns full event history) |

---

## Components

| Component | Description |
|---|---|
| `Nav` | User-aware navigation with mobile hamburger |
| `Footer` | Site footer with links |
| `ChatWidget` | Floating AI chat bubble — connects to `/api/chat` |
| `SocialProof` | Stats bar + testimonial cards |
| `SellerCallout` | Platform-specific pain points section |
| `PricingCard` | Individual pricing tier card (accepts `PricingTier` prop) |
| `FAQ` | Accordion FAQ — accepts `FAQItem[]` prop |
| `FinalCTA` | Closing conversion section with customizable copy |
| `HeroTracker` | Inline tracking widget for the homepage hero |
| `ShrinkageCalculator` | Interactive savings calculator |
| `PricingToggle` | Monthly/annual pricing toggle |
| `USMap` | Animated US coverage map |

---

## Setting up the AI chat widget

1. Run a [LiteLLM proxy](https://docs.litellm.ai/docs/proxy/quick_start):
   ```bash
   pip install litellm
   litellm --model gpt-4o-mini
   # Proxy is now at http://localhost:4000
   ```
2. Set in `.env.local`:
   ```
   LITELLM_URL=http://localhost:4000
   LITELLM_MODEL=gpt-4o-mini
   ```
3. Restart `npm run dev`. The chat widget at the bottom right is now live.

The chat widget falls back to a friendly "not configured" message if `LITELLM_URL` is unset, so it never breaks the UI.

---

## Setting up email (Resend)

1. Sign up at [resend.com](https://resend.com) (free — 100 emails/day).
2. Create an API key at `https://resend.com/api-keys`.
3. Fill in `.env.local`:
   ```
   RESEND_API_KEY=re_your_key_here
   RESEND_FROM=Shipping Cow <onboarding@resend.dev>
   INQUIRY_TO_EMAIL=you@yourdomain.com
   ```
4. Restart `npm run dev`.

Inquiry confirmation emails, new-lead notifications, and password reset emails all go through Resend. Each feature degrades gracefully (saves to DB, just no email) if the key is missing.

---

## Demo tracking numbers

Three numbers are seeded automatically:

- `SC123456789` — Out for delivery
- `SC987654321` — In transit
- `SC111222333` — Delivered

Test them at `/track`.

---

## Production deployment

### Vercel (recommended)

1. Push to GitHub.
2. Import at [vercel.com](https://vercel.com).
3. Add all env vars from `.env.local` in the Vercel dashboard.
4. Deploy.

**Note:** Vercel's filesystem is ephemeral — swap `DATABASE_URL` to a hosted Postgres (Vercel Postgres, Supabase, or Neon) before going live.

### Railway / Render

Both support persistent disk for SQLite. Connect your repo, add env vars, deploy. No DB migration needed.

---

## Before going public

- [ ] Replace `JWT_SECRET` with a real random value
- [ ] Configure Resend with your own domain (not `onboarding@resend.dev`)
- [ ] Migrate to a hosted database
- [ ] Add rate limiting to `/api/auth/login`, `/api/auth/signup`, `/api/inquiry`
- [ ] Configure `LITELLM_URL` and a production LLM key
- [ ] Point your domain at the deployment

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Custom CSS design system + Tailwind CSS 3 |
| Database | better-sqlite3 (dev) / Postgres (prod) |
| Auth | JWT via `jose` + bcrypt |
| Email | Resend |
| AI chat | LiteLLM proxy (model-agnostic) |
| Deploy | Vercel / Railway / Render |

---

— Moo's honor. 🐄
