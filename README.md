# AfriCover247 — Digital Insurance Portal

Monorepo for the AfriCover247 digital insurance platform.

## Apps

| App | Tech | Port | Description |
|-----|------|------|-------------|
| `apps/api` | NestJS | 3001 | Backend API (serves all frontends) |
| `apps/web` | Next.js | 3000 | Customer web app |
| `apps/mobile` | React Native / Expo | — | iOS + Android mobile app |
| `apps/admin` | Next.js | 3002 | Admin panel for AfriGlobal staff |

## Shared Packages

| Package | Description |
|---------|-------------|
| `packages/types` | Shared TypeScript interfaces used across all apps |
| `packages/utils` | Shared utility functions (formatters, validators) |

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` in each app and fill in values
3. Run `npm install` from root
4. Start PostgreSQL database
5. Run `cd apps/api && npx prisma migrate dev`
6. Run each app: `npm run api`, `npm run web`, `npm run admin`, `npm run mobile`

## Reference

- SLA Reference: AFRIGLB-EBSL-SLA-2026-001
- PRD Version: 1.0
