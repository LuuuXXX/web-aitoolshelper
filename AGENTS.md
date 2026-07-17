<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Commands

- **Lint:** `npm run lint`
- **Typecheck:** `npx tsc --noEmit`
- **Tests:** `npm test` (vitest; config in `vitest.config.ts`, tests in `tests/`)
- **Build:** `npm run build` (runs `prisma generate && next build`)

# Conventions

- Test files live in `tests/` (excluded from tsconfig + Next build); `tests/setup.ts` loads `.env`.
- `tests/__mocks__/` stubs `server-only` and `next/headers` so server-only modules can be unit-tested.

# Deployment

- Production runs via PM2 (`ecosystem.config.js`, app `aitoolshelper`, `next start -p 3000`, cluster mode, 1 instance).
- **`npm run build` overwrites `.next/` while the live server runs** → causes `Failed to find Server Action` errors and broken pages. After any build, always restart: `pm2 restart aitoolshelper`.
- Logs: `pm2-logs/error.log` / `pm2-logs/out.log`; status: `pm2 list`.
