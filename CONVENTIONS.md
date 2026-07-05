# AfriCover247 — Code Conventions

## Comments policy

Comments in this codebase are restricted to:

- Section headers: `// --- Section Name ---`
- One-line function labels: `// Verify password hash`
- TODOs: `// TODO: description of what needs doing`

No explanatory comments. No JSDoc blocks. No inline narration.
Code should be readable without comments. If it needs a comment to explain what it does, rename the variable or extract a function instead.

## Naming conventions

- Variables and functions: camelCase
- Classes and interfaces: PascalCase
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case for all files except React components (PascalCase)
- Database fields: camelCase in Prisma, snake_case in raw SQL

## File structure

Each NestJS module contains: module.ts, service.ts, controller.ts, dto/ folder
No logic in controllers — controllers call services only
No database queries outside of services — services call Prisma only

## No magic numbers

All numeric constants should be named: `const OTP_EXPIRY_MINUTES = 10` not `expiresAt = new Date(Date.now() + 10 * 60 * 1000)`

## Error handling

Always use NestJS HTTP exceptions with clear messages — never throw generic Error objects from controllers or services
Never swallow errors silently unless explicitly intentional (email failures are an exception — log but don't throw)
