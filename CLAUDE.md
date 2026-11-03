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
- `apps/web` — Next.js 15 (Vercel), Tailwind
- `apps/mobile` — Expo SDK 54 React Native (EAS, @gsmdev/africover247)
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
- Premium resolution order: product.premiumAmount → formData.calculatedPremium → formData.quotedPremium → presetAmount → 0. Use everywhere (web, mobile, API).
- Quote flow: accept quote creates `pending_payment` application with formData `{ quoteId, fromQuote: true, quotedPremium }`. Acceptance must be atomic (conditional `updateMany` in a transaction).
- Exactly 20 active products. Seed deactivates others. Deletes need FK-ordered cascade (claimStatusHistory → claimDocument → claim → policies → ...).
- `requiredDocuments` is a newline-separated string, parse with `split('\n')`, never `JSON.parse`.
- 4-step application wizard: Personal → Address & Employment → KYC Documents → Review. Web and mobile must stay in sync.
- KYC (Dojah): BVN/NIN/DL/Passport, persisted at user level; verified users do not re-verify for later policies.
- SLA tracking and manual call logging exist under support/admin; keep targets in `sla.config.ts`.

## Security requirements (VAPT + code review)
- JWT carries `tokenVersion`; logout, password change and reset must increment it.
- Monnify webhook: HMAC sha512 over raw body, `timingSafeEqual`, no sandbox bypass; verify transaction status and amount before issuing a policy.
- Social login must verify ID tokens server-side (Google via google-auth-library; Apple via JWKS — still TODO).
- Policy numbers via `crypto.randomInt` with uniqueness retry.
- Gates: Critical by 15-Oct-2026, High by 21-Oct-2026, Medium by 04-Nov-2026.

## Open items
- Verify GT-001..GT-006 changes compile; web/mobile Google sign-in must send `idToken`.
- Monnify webhook needs true raw body (rawBody middleware).
- Apple JWKS verification. GT-003 monthly plan needs AfriGlobal decision. SYS-01 add tests (payments, auth, quotes, policies, claims, KYC).
- Retest JWT invalidation on password change/reset.
- Screenshot prevention is TEMPORARILY DISABLED in mobile; must be re-enabled before production.
- Infra pending: rotate DO DB password and Spaces keys; Render → DO App Platform (last); africover247.com.ng not purchased; Apple App Store (EAS error).

## Working style
- The user wants quick, step-by-step output and exact commands.
- Do the work yourself, run the builds, fix errors, then summarise in a few lines with the git commands to run.
