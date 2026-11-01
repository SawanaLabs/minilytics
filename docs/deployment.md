# Sawana deployment

This fork runs as a single-user dashboard on Sawana's Cloudflare account.

- Repository: https://github.com/SawanaLabs/minilytics
- Production: https://minilytics.hsawana9.workers.dev
- Worker: `minilytics`
- D1 database: `minilytics`, binding `DB`, APAC location
- Upstream baseline: `c5f0774aef7c09817c7f12cd8e38a1b6f2a291bc`

The account and database IDs are configured in `wrangler.jsonc`. Preview URLs are disabled.

## Private login

Production requires the Cloudflare secrets `ADMIN_PASSWORD` and `SESSION_SECRET`. Set secrets through Wrangler using private input; keep their values out of Git, shell arguments, and logs. Changing `SESSION_SECRET` invalidates existing sessions.

Sawana requested an automatically generated temporary password for setup on 2026-11-01 and will replace it after verification. Its recovery copy is encrypted with Windows DPAPI for the current Windows user at `%LOCALAPPDATA%\Sawana\Minilytics\temporary-admin-password.dpapi`, outside this repository. Decrypt it only inside the process that needs it; do not print it.

To replace the temporary login, update `ADMIN_PASSWORD` in the Worker's Cloudflare settings and replace `SESSION_SECRET` with a new random secret to invalidate existing sessions. After the new login works, remove the obsolete local temporary credential.

Leave Google OAuth and `PLAN_*` settings unset. Configuring Google OAuth enables the optional public SaaS mode instead of the single-user password mode.

The dashboard APIs require a login. Event ingestion and signed payment webhooks remain reachable by tracked websites and payment providers. Protecting the entire hostname with an additional login gate would also block those endpoints.

## Development and deployment

Use Node.js 24 and install the locked dependencies with `npm ci`. For local development, copy `.dev.vars.example` to the ignored `.dev.vars`, run `npm run db:migrate:local`, and start `npm run dev`.

Before publishing, run:

```sh
npm run typecheck
npm test
npm run build
```

With the local Worker running, `npm run smoke` verifies login, tracking, Dodo and Stripe signatures, renewals, refunds, duplicate notifications, attribution, and site cleanup using synthetic data. It also accepts `BASE` and `ADMIN_PASSWORD` through the process environment for an authorized production check; never pass the password as a command-line argument.

Deploy with `npm run deploy` after confirming Wrangler targets Sawana's account. It builds the frontend, applies pending D1 migrations, and publishes the Worker. Cloudflare credentials come from the local Wrangler login.

## Initial integration state

Deploying the application does not import GA4, GSC, Clarity, or historical payments, and does not install tracking on existing websites. Add the owned websites and connect data sources separately. The first deployment uses an empty production database rather than demo traffic or revenue.

Before connecting a shared Stripe account, resolve site ownership filtering and verify the income totals. Waffo, natural-month summaries, and multi-currency reporting still need the changes identified in the research notes.

The initial setup updates MapLibre, Vitest, and Wrangler to address the dependency advisories found during installation. MapLibre's namespace import matches its version 6 exports.

Production verification exposed stale webhook settings across Worker isolates: a settings change only cleared the cache in the isolate handling that change. Site settings now come directly from D1, with a regression test for a setting updated by another request. This adds one indexed site lookup to ingestion and avoids distributed cache invalidation.

## Verified on 2026-11-01

Type checking, 25 unit tests, and the production build passed. Dependency installation reported no known audit findings. The full flow script also passed against the deployed Worker, including private login, event ingestion, attribution, Dodo notifications, Stripe checkout deduplication, partial refunds, initial subscription invoice deduplication, and renewal income. It used synthetic signed notifications without contacting a payment provider or making a charge, and deleted its temporary site and data afterward.

The deployed runtime fix is commit `88ef076`, Cloudflare version `c3d28b6c-355e-4424-8a64-001fad1a93ca`. The data-source integration limits above still apply.
