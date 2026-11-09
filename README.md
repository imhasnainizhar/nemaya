# nemaya.

An organic streetwear store, built as a portfolio project: a **Medusa v2** commerce backend and a **Next.js 16** storefront in a **Turborepo + pnpm 12** monorepo.

**Payments run in Stripe TEST mode only.** The backend refuses to boot with a live key.

| | Local | Production |
|---|---|---|
| Storefront (Next.js) | http://localhost:8000 | Vercel |
| API + Admin (Medusa) | http://localhost:9000/app | Docker on AWS (server + worker) |
| Postgres | container | Neon |
| Redis | container | separate instance (`deploy/redis`) |
| Media storage | RustFS (S3) container | Cloudflare R2 |
| Email | Mailpit → http://localhost:8025 | any SMTP (SES, Resend…) |

---

## Features

- **Auth:** sign up with full name, username and one of 12 original SVG avatars. Sign in with email **or** username. Username can be changed 2× per 30 days, and old names are held for 30 days. Password reset and in-account password change are supported.
- **Cart and checkout:** promo codes; Stripe Card Element (test card `4242 4242 4242 4242`); free standard shipping over $99.
- **Gift cards** (custom module):
  - Digital cards at $25/$50/$100/$200 or a custom $10–$500 amount, sent to a recipient with a message.
  - Optional scheduled delivery date.
  - Partial use with the remaining balance kept, up to 3 cards per order.
  - Implemented with native cart **credit lines**, so a fully covered order needs no payment.
  - Full balance ledger. Admin can issue, adjust, disable or set expiry.
  - Gift cards can't be bought with gift cards.
- **Wishlist** (custom module) with **price-drop** and **back-in-stock** alerts.
- **Notifications** (custom `messaging` module, no Firebase):
  - Channels: email (SMTP), **Web Push (VAPID)** and an **in-app inbox** (the bell icon).
  - 19 notification types, each with an admin switch, per-channel toggles, editable templates, rules (delay, throttle, threshold) and 30-day sent/failed stats.
  - **Locked security types** can never be disabled, enforced in the API, not just the UI: password reset, password changed, email changed, new sign-in from a new device.
  - Automated: welcome, order placed/cancelled/shipped/delivered, refund, gift card purchased/received/used, abandoned cart, sale started (Medusa promotion campaigns).
  - **Admin campaigns:** broadcast to all customers, a customer group, or people who wishlisted a product. Send now, schedule, or send a test to yourself.
  - Customer preferences: marketing email/push opt-out and per-type mute.
- **Admin extensions:** Notifications, Campaigns and Gift cards pages, plus a customer profile widget (avatar, username, signed-in devices).

## Repository layout

```
apps/
  backend/        Medusa v2 — custom modules, API routes, subscribers, jobs, admin UI
    src/modules/  profile · wishlist · gift-card · messaging · smtp-notification · webpush-notification
  storefront/     Next.js 16 (App Router, Tailwind v4)
packages/
  avatars/        12 SVG avatars shared by backend, storefront (and the future mobile app)
docker/           dev image, production backend image + entrypoint
deploy/
  medusa/         production compose: server, worker, migrate, optional Caddy
  redis/          production compose for the standalone Redis instance
scripts/          env bootstrap + container entrypoints
```

## Local development

Requirements: Docker Desktop, plus Node ≥ 22 for the helper script.

```bash
pnpm docker:dev
```

This command:
1. Creates `.env.docker` from `.env.docker.example`, with fresh secrets and a VAPID key pair (only the first time).
2. Starts Postgres, Redis, RustFS (S3) and Mailpit, then installs dependencies inside Docker.
3. Runs migrations and seeds demo data (11 products with illustrations, a sale price list, a demo customer and an admin user).
4. Starts `medusa develop` and `next dev`. Both hot-reload; file polling is enabled for Windows/macOS bind mounts.

| What | Where | Login |
|---|---|---|
| Store | http://localhost:8000 | demo customer `ayla` / `Nemaya-Demo-2026` |
| Admin | http://localhost:9000/app | `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.docker` |
| Emails | http://localhost:8025 | – |
| S3 console | http://localhost:9101 | `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` |

To test with Stripe, put **test** keys in `.env.docker`: `STRIPE_API_KEY=sk_test_…` and `NEXT_PUBLIC_STRIPE_KEY=pk_test_…`. Then reset with `pnpm docker:reset && pnpm docker:dev`, because the region's payment provider is set when the store is seeded. Without keys, checkout uses Medusa's built-in test provider.

### UI-only mode (no Docker)

For pure front-end work, run the storefront on the host against an in-memory mock of the Medusa API. The catalog, collections, search and cart all work; sign-in and checkout need the real backend.

```bash
pnpm --filter @nemaya/storefront dev:mock      # → http://localhost:8000
```

The mock reads the same product list and garment art as the backend seed (`packages/demo-catalog`). It is only active when `NEMAYA_MOCK=1`.

Other commands:

```bash
pnpm infra:up       # only Postgres/Redis/S3/Mailpit (run apps on the host instead)
pnpm docker:down    # stop
pnpm docker:reset   # stop and wipe all data volumes
pnpm typecheck      # turbo typecheck for all packages
```

After changing a custom module's models, generate a migration:

```bash
docker compose run --rm --no-deps backend sh -c "cd apps/backend && pnpm medusa db:generate <module>"
```

> **Windows note:** run the backend through Docker rather than on the host. SWC's native binary refuses some Windows profile ACL setups.

## Production

### 1. Redis (its own instance)
```bash
cd deploy/redis && cp .env.example .env    # set REDIS_PASSWORD
docker compose up -d
```
Only allow port 6379 from the Medusa instance's security group.

### 2. Medusa (server + worker)
The backend image is built by GitHub Actions (`.github/workflows/ci.yml`, amd64 + arm64) and pushed to `ghcr.io/<you>/nemaya-backend`. To build it locally:

```bash
docker build -f docker/backend.Dockerfile -t nemaya-backend .
```

On the server:
```bash
cd deploy/medusa && cp .env.production.example .env.production   # fill in Neon, Redis, R2, SMTP, VAPID, Stripe test keys
docker compose --profile tools run --rm migrate     # migrations + admin user (+ demo seed if SEED_DEMO_DATA=true)
docker compose up -d server worker
docker compose --profile proxy up -d caddy          # optional automatic HTTPS for API_DOMAIN
```
- The `server` role serves the API and admin; the `worker` role runs subscribers, scheduled jobs and campaign sends. They use the same image with a different `MEDUSA_WORKER_MODE`.
- Run `migrate` again on every release.

### 3. Storefront on Vercel
- Root directory: `apps/storefront`. Vercel detects Turborepo and pnpm.
- Set the variables from `apps/storefront/.env.example`. `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is printed in the `migrate` logs, and also appears in Admin → Settings → Publishable API keys.

### Cloudflare R2
Create a bucket and enable public access (an r2.dev URL or a custom domain such as `media.nemaya.store`). Set the `S3_*` variables, with `S3_FILE_URL` as the public base URL. Add the hostname as `NEXT_PUBLIC_MEDIA_HOST` on Vercel.

## Env files

| File | Used by | Committed |
|---|---|---|
| `.env.docker.example` → `.env.docker` | local `docker-compose.yml` | example only |
| `deploy/medusa/.env.production.example` → `.env.production` | production Medusa containers | example only |
| `deploy/redis/.env.example` → `.env` | production Redis | example only |
| `apps/storefront/.env.example` | reference for Vercel env vars | example only |
| `apps/backend/.env.example` | optional host-run backend (macOS/Linux) | example only |
