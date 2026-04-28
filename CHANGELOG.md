# Changelog

## 2026-04-25 — Pre-Launch Audit Sprint

### Security
- Auth rate limiting added to login, signup, forgot-password, reset-password (lib/rate-limit.ts)
- JWT secret hardened — lazy getter, no build-time crash, dev fallback only in non-prod
- .env.example updated with DATABASE_URL, OPENROUTER_API_KEY, SENTRY_DSN

### Bug Fixes
- All shippingcow.io references replaced with shippingcow.ai (7 files)
- App layout OG URL, sitemap, blog feed, blog posts, dashboard — all now .ai

### Features
- app/not-found.tsx — branded 404 page
- Vercel Analytics (cookieless, no consent banner needed)
- app/sitemap.ts — auto-generated sitemap with all routes
- OG image: font switched from Arial Black → Inter (Satori-safe)
- Chat widget: "Online" badge removed

### Chat Widget Improvements
- Messages now persist across route changes (sessionStorage)
- Panel close preserves typed email (sessionStorage)
- Email capture delayed to 3+ messages (was 2)
- Default opener removed for returning users (loads from sessionStorage)

### Infrastructure
- @vercel/analytics installed
- @sentry/nextjs installed (no-ops without DSN)
- vitest + 13 integration tests for cost engine
- Blog ISR: 1 hour revalidation on list + slug pages
- sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts created
- next.config.js wrapped with withSentryConfig
- instrumentation.ts for Sentry auto-load

### Documentation
- plan-pre-launch.md updated to v2 (4 critical, 6 high, 8 medium, 6 nice-to-have)
- competitor.md created (5 competitors: LowShipRate, Pirate Ship, Shippo, OnTrac, FedEx/UPS)
- work-plan.md created (24 items, 5 phases)
- COMPACT.md created (76% compressed CLAUDE.md)
- llm-wiki initialized in Obsidian vault (LLM Wiki/)
- 5 competitor entities ingested into llm-wiki

### Knowledge Base
- llm-wiki moved to Obsidian vault (~/Library/Mobile Documents/com~apple~CloudDocs/obsidian/LLM Wiki/)
- WIKI_PATH set in ~/.zshrc + ~/.hermes/.env
- sync.sh created for auto-deploying research skills

### Social
- 22 social media cron jobs identified as PAUSED (not failing) — all paused Apr 20
- shippingcow-news cron still running (daily 8am)
- Social media links needed on website (T08 pending)

### Technical Debt
- Calculator localStorage migration deferred (plan in T10)
- CSS module extraction deferred (plan in T11)
- cookies() future-proofed for Next.js 15 in auth.ts
