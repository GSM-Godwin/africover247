# AfriCover247 — Claude Code Project Guide

Digital insurance platform for AfriGlobal Insurance Brokers Limited (NAICOM-licensed). Built by Edgeverve (EBSL). Developer: gsmdev.

## Hard rules (never break)
- NEVER run `git commit`, `git push`, `git reset`, `git revert`, `git rebase`, or `git checkout -- .`. The engineer commits manually. After changes, print the exact git commands for the user to run.
- NEVER write secrets, passwords, API keys, or connection strings into any file, log, or chat. Use env vars only. Never print `.env` contents.
- NEVER log OTPs, tokens, passwords, or full KYC numbers (BVN/NIN/DL/passport).
- No destructive DB commands (`migrate reset`, `db push --force-reset`, `DROP`, `TRUNCATE`, bulk deletes) without explicit confirmation in the same turn.
- Do not modify or delete the VAPT test accounts (vapt.user1, vapt.user2, vapt.admin @africover247.com).
- Do not start deploys or change Render/DO/Vercel/Cloudflare settings.

## Repo layout
- `apps/api` — NestJS 11 + Prisma 6.19.3 + PostgreSQL (Digital Ocean managed, FRA1)
- `apps/web` — Next.js 16 (Vercel), Tailwind
- `apps/mobile` — Expo SDK 54 React Native (EAS, @gsmdev/africover247)
- Bundle IDs: iOS `com.afriglobal.Africover247`, Android `com.africover247.app`
- `apps/admin` is legacy; admin lives in `apps/web/src/app/admin`

## Build / verify (run after every change set)
- API: `cd apps/api && npx nest build`
- Web: `cd apps/web && npm run build 2>&1 | tail -20`
- Mobile: `cd apps/mobile && npx tsc --noEmit`
- Prisma: `cd apps/api && npx prisma generate`

## Migrations
- `prisma migrate dev` fails (modified history). Use hand-written SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` then `npx prisma migrate deploy`.
- If the column already exists, use `npx prisma migrate resolve --applied <name>`.
- User password field is `passwordHash` (not `password`). Payment reference field is `gatewayReference`.

## Code conventions
- No explanatory comments, no JSDoc. Self-explanatory names.
- Use the `@CurrentUser` decorator in controllers.
- DTOs: whitelisted, `forbidNonWhitelisted`. Strip `passwordHash` from all responses.
- Admin actions go through `AdminService.createAuditLog`.
- UI: Tailwind tokens (midnight, daybreak, slate, cover-green, alert-coral). Admin pages use `p-6 sm:p-8` wrapper and `AdminPageHeader`. Tables must scroll horizontally (`overflow-x-auto`).

## Business rules
- Pricing types: `fixed`, `calculable`, `quote_based`.
- Premium is owned by the server: `PremiumService` in `apps/api/src/premium` resolves product.premiumAmount → server-calculated premium (calculable: product rate × declared asset value from `Application.assetDetails`) → accepted Quote.finalAmount (quote must belong to the same customer and product) → 0. Payment initiation, the Monnify webhook amount check and policy issue all use it. Clients may only display premium (same order via `apps/web/src/lib/premium.ts` and `apps/mobile/src/utils/premium.ts`; mobile's `presetAmount` route param is a display-only fallback) and must never send it.
- `calculatedPremium`, `quotedPremium`, `quoteId`, `fromQuote` are not client-writable (not in the update DTO formData allowlist). `POST /applications` ignores a client `calculatedPremium` and stores the server value.
- Applications can only be updated (`PUT /applications/:id`) while in `draft`.
- Quote flow: accept quote creates a `pending_payment` application with formData `{ fromQuoteId, calculatedPremium }` (older records may have `quoteId`; use `linkedQuoteId()` in `apps/api/src/common/helpers`). Acceptance must be atomic (conditional `updateMany` in a transaction).
- Exactly 20 active products. Seed deactivates others. Deletes need FK-ordered cascade (claimStatusHistory → claimDocument → claim → policies → ...).
- `requiredDocuments` is a newline-separated string, parse with `split('\n')`, never `JSON.parse`.
- 4-step application wizard: Personal → Address & Employment → KYC Documents → Review. Web and mobile must stay in sync.
- KYC (Dojah): BVN/NIN/DL/Passport, persisted at user level; verified users do not re-verify for later policies.
- SLA tracking and manual call logging exist under support/admin; keep targets in `sla.config.ts`.
- Account deletion: `DELETE /users/me` anonymises the user and sets `User.deletedAt`; deleted users are refused everywhere (JWT strategy, login, social login, step-up).

## Security requirements (VAPT + code review)
- JWT carries `tokenVersion`; logout, password change and reset must increment it.
- Monnify webhook: HMAC sha512 over raw body, `timingSafeEqual`, no sandbox bypass; verify transaction status and amount before issuing a policy.
- Social login verifies ID tokens server-side: Google via google-auth-library; Apple via JWKS (done). Sign in with Apple is iOS-only; the Apple refresh token is stored encrypted (`FIELD_ENCRYPTION_KEY`, AES-256-GCM helper in `apps/api/src/common/crypto`) and revoked on account deletion. Exchange and revoke are skipped with a startup warning when the Apple key env vars are missing.
- Payment step-up: `verify-password` (password users) or the email one-time code (Google/Apple users, `/auth/step-up/email/*`) returns a 10-minute `payment-stepup` token sent as `X-Step-Up-Token` to `POST /payments/initiate`. Enforcement is controlled by `ENFORCE_PAYMENT_STEP_UP` and stays OFF until the mobile version that sends the token is released. `verify-password` has a per-user limit of 5 failures per 15 minutes.
- Mobile screenshot prevention: `useScreenProtection()` on sensitive screens (application wizard/KYC, payment, policy detail, account/profile/password, claim detail/new claim), on focus only. Enabled only in EAS production builds via `extra.screenProtection` (`APP_SCREEN_PROTECTION` env in the eas.json production profile).
- Policy numbers via `crypto.randomInt` with uniqueness retry.
- Gates: Critical by 15-Oct-2026, High by 21-Oct-2026, Medium by 04-Nov-2026.

## Open items
- GT-001, GT-002, GT-004, GT-005, GT-006: done.
- GT-003 monthly plan needs AfriGlobal decision.
- Monnify webhook needs true raw body (rawBody middleware).
- SYS-01 add tests (payments, auth, quotes, policies, claims, KYC).
- Retest JWT invalidation on password change/reset.
- Turn on `ENFORCE_PAYMENT_STEP_UP` after the mobile release that sends `X-Step-Up-Token` is widely adopted.
- Infra pending: rotate DO DB password and Spaces keys; Render → DO App Platform (last); africover247.com.ng not purchased; Apple App Store (EAS error).

## Working style
- The user wants quick, step-by-step output and exact commands.
- Do the work yourself, run the builds, fix errors, then summarise in a few lines with the git commands to run.
