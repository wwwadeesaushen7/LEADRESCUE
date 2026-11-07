# LeadRescue

**Never lose a customer to a missed call again.**
web link - https://leadrescue-nu.vercel.app
A Next.js, React, TypeScript and Tailwind SaaS foundation for consent-based WhatsApp and SMS missed-call recovery. This repository implements **Phase 1** of the requested build. It contains a real server-side authentication/onboarding backend and a separate, credential-free demo dashboard.

## Just want to use the app?

Read [Start here](docs/START_HERE.md) for a plain-English explanation. The app now includes Android and desktop browser installation support at `/install`, plus an app launcher at `/app`. It needs a published HTTPS address before installation on your own device. No public deployment has been made. Internet access is required; private data is not cached for offline use.

## Start locally

Install Node.js 22 or newer (Node 24 is tested), then run:

```bash
cd LEADRESCUE
npm ci
npm run dev
```

On your own machine, open `http://localhost:3000`. Choose **Watch demo**, or open `/demo`. No environment variables, Twilio purchases, account creation, or API payments are necessary for the demo.

Try **Set up demo business**, change the name and hours, and submit. The Next.js `/api/demo` route validates the request and saves your demo preferences in an HTTP-only, same-site browser cookie for seven days. Reloading retains the business; another browser gets a separate demo. All dashboard call data is fictional and labeled. Chart period controls, call search, notification controls, theme selection, FAQ, and responsive navigation work.

The full incoming-call/recovery/booking simulator will be built in Phase 3. Demo preferences contain no credentials and authorize no live data. Avoid entering sensitive information in a demo.

## What is implemented

- Marketing site, pricing page, dark/light themes and responsive layouts.
- Web app manifest, Android/desktop icons, browser installation controls and installation guide. Installation requires browser support and an HTTPS deployment (loopback is permitted for development). The browser owns the installation prompt; there is no APK/EXE or app-store listing.
- Signup, login, logout, email-verification callback, forgot/reset password, and profile-name editing using Supabase Auth.
- Server-side validation, same-origin mutation checks, verified-user authorization, and PKCE session refresh.
- Business onboarding: name, category, phone, email, location, timezone, website, description and weekday hours.
- Atomic, idempotent first-business creation in PostgreSQL.
- Tenant-private business dashboard, account settings and database Row Level Security.
- Demo onboarding/dashboard with explicitly simulated activity; live dashboards never substitute fake data.
- Subscription-ready storage and provisional pricing; **no payments or messaging are active**.

## Architecture

```text
Browser → Next.js pages and API routes → Supabase Auth + PostgreSQL/RLS
        → Separate demo pages/API      → Non-sensitive demo cookie + fixtures
```

`src/app` contains pages/API routes. `src/components` contains reusable UI. `src/lib/auth` enforces live authentication; `src/lib/supabase` creates the cookie-aware server client. `src/lib/demo` contains simulated data, which live routes never use. Shared Zod schemas validate business/auth inputs. `supabase/migrations` defines database tables, RLS, and the business-creation transaction. Tests are separated into adapter/unit, database, and browser tests.

No admin/service-role key is needed for the current application. Database requests use the caller's session and remain subject to RLS. Members cannot grant themselves access or edit subscription status. Automatic recovery is disabled by a database constraint until its consent and sender verification workflow exists.

## Connect your Supabase project

1. Create a Supabase project using your own account. Do not share keys in chat.
2. In **SQL Editor**, run `supabase/migrations/0001_foundation.sql` once. Alternatively, link the project with the Supabase CLI and run `supabase db push`.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` to the project URL and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to its publishable key. The older anonymous key also works. These are public client credentials, not service-role secrets. Set `APP_URL` to your exact app origin.
4. In Supabase **Authentication → URL Configuration**, set Site URL to your app origin. Add the exact callback URLs `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/callback?next=/reset-password` for local development. Use your actual HTTPS origin in deployment. Do not use a broad production wildcard.
5. Enable email/password authentication and **Confirm email**. Configure a production SMTP provider before launching; Supabase's development email provider has restrictions and rate limits. The application uses the standard PKCE email flow: open verification/recovery links in the same browser that requested them. Do not remove the redirect target from Supabase's standard email templates.
6. Restart the dev server (and rebuild deployments after changing public environment variables).
7. Create an account, verify its email, sign in, and complete business onboarding. Log out and log in again. Request a password reset and verify the new password. Edit the profile name in Settings.
8. Create a second account and business; confirm it cannot see the first account's business. Hosted email delivery and Supabase session behavior must be tested on your configured project; local adapter tests are not a replacement.

If using the restricted Codex cloud environment, add your exact `<project-ref>.supabase.co` hostname to environment networking. Enter environment variables in environment settings securely. The project URL/keys are not currently configured in this workspace.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

If Chromium is already installed, skip the download:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

The browser suite runs the app without Supabase credentials; use an unconfigured test environment. It checks desktop and mobile. `APP_URL`, if set, must match the test origin `http://127.0.0.1:3000`; otherwise use the default unset value for local tests.

- `tests/validation.test.ts`: business validation, passwords, redirect allowlist.
- `tests/auth.test.ts`: mocked Supabase adapter; unauthorized/unverified access, cross-origin requests, signup and reset handling. **Not a real email integration test.**
- `tests/isolation.test.ts`: executes the actual SQL migration and tenant policies against embedded PostgreSQL (PGlite), with a small simulated Supabase `auth` schema. Tests forged memberships, cross-business writes, private profiles, idempotent setup, messaging and subscription gates.
- `tests/e2e`: real Next.js browser flows, demo persistence/isolation, chart/search controls and route protection. **No Twilio traffic.**

## Deployment on Vercel

1. Push this repository to your GitHub account when you are ready; import it into Vercel as a Next.js project. Use Node 24 (or a supported Node 22+) and the default `npm run build` command.
2. **For the demo only, leave Environment Variables empty.** The app trusts the exact deployment hostname provided by Vercel and, for production deployments, its project production hostname. No Supabase or Twilio account is required. For live accounts later, add the three variables from `.env.example`, apply the Supabase migration, and update the Supabase Site URL/callback allowlist. Set `APP_URL` to your exact HTTPS origin when using a custom domain or configuring live authentication.
3. Deploy and try `/demo`, `/onboarding?mode=demo`, and `/install`. If live accounts are configured, also run the hosted auth checklist above. HTTPS enables secure demo cookies. The frontend and API run on Vercel; account/business data runs in Supabase, so your personal computer does not need to stay on.
4. `APP_URL`, when supplied, overrides automatic hostname detection and must match the site you use. Preview deployments use their own `VERCEL_URL`; they do not trust the production hostname. Self-hosted production deployments require `APP_URL`. Unknown origins are rejected.

The demo uses a cookie rather than server disk, so it works on serverless deployments. Live recovery is not implemented and must not be activated until a **durable hosted worker** is configured and tested in later phases.

## Next steps

Continue with Phase 2 after reviewing the Phase 1 foundation. See [the development plan](docs/ROADMAP.md) and [provider/deployment preparation](docs/INTEGRATIONS.md). This phase does not implement lead CRUD, inbox sending, appointment booking, Twilio webhooks, the complete simulator, administration, payments or AI. Those features are deliberately left for their tested phases.
