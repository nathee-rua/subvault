# Changelog

All notable changes to SubVault will be documented in this file.

## [1.1.0] - 2026-07-31
### Security
- **Secret Remediation:** Removed hardcoded Telegram bot token fallback string from `route.ts`. Telegram Bot API token is strictly sourced from `process.env.TELEGRAM_BOT_TOKEN`.
- **Gitleaks Scan:** Verified working tree scan `npm run secrets:check` (775 MB scanned, 0 leaks).

### Added & Fixed
- **Smart Text Parser:** Implemented Thai BE Year conversion (`2569` -> `2026`) and automatic separation of `Account` and `Password` fields from raw Telegram messages into respective database columns.
- **Telegram Interactive Prompt:** Added Inline Keyboard buttons (`Confirm & Save to Vault` / `Cancel`) requiring explicit user confirmation before writing rows into Supabase PostgreSQL.
- **Real-Time Cloud Synchronization:** Implemented 8-second auto-polling and window focus listener in `AppShell.tsx` for real-time dashboard and vault updates.

## [1.0.0] - 2026-07-31
### Deployment & Infrastructure
- Created and deployed Supabase PostgreSQL 17 database instance (`SubVault` ref: `vnueckwzcovkzremoqzz`) in `ap-southeast-1`.
- Executed full database schema migration ([`001_initial.sql`](file:///c:/AI%20antigravity/SubVault/app-temp/supabase/migrations/001_initial.sql)) including 10 tables, indexes, Row Level Security (RLS) policies, and auto-update triggers.
- Created and pushed remote GitHub repository [https://github.com/nathee-rua/subvault](https://github.com/nathee-rua/subvault).
- Deployed production Next.js application to Vercel at [https://app-temp-pink.vercel.app](https://app-temp-pink.vercel.app) with configured environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VAULT_ENCRYPTION_KEY`, `CRON_SECRET`).

### Testing
- Integrated and verified Playwright v1.62 E2E browser acceptance testing suite (`tests/e2e/`), executing 22/22 tests across Chromium Desktop and Mobile viewports.
- Added environment safety guard script (`scripts/assert-e2e-safe-env.mjs`) to prevent running destructive E2E tests against production environments.
- Added GitHub Actions workflow (`.github/workflows/e2e.yml`) for automated Playwright browser testing on pull requests and main/master pushes.
- Added HTML report generation script (`scripts/generate-e2e-report.mjs`), E2E summary report (`docs/test-reports/latest-e2e-summary.md`), and E2E guide (`docs/E2E_TESTING.md`).

### Fixed
- Fixed mobile layout grid column overflow (`minmax(400px, 1fr)`) on mobile viewports in `DashboardPage`.

### Security
- Installed `@b12k/gitleaks` wrapper package ensuring Gitleaks v8.30.1 availability in local environments.
- Updated npm script wiring so `secrets:check` runs `npx gitleaks dir . --config .gitleaks.toml --redact --exit-code 1 --no-banner` and `secrets:history` runs `npx gitleaks git . --config .gitleaks.toml --redact --exit-code 1 --no-banner`.
- Verified working tree and Git history scans with Gitleaks 8.30.1.

## [1.0.0] - 2026-07-30
### Added
- Complete modern AI Sci-Fi UI design system with particle backgrounds, glowing glassmorphic cards, and cyan/violet accents.
- User authentication flow using single-user MVP username system.
- Interactive Dashboard with spending analytics, renewal timelines, and risk alerts built with Recharts.
- Subscription Vault List supporting search, category filter, status filter, sorting, grid/list view toggle, and soft-delete/restore.
- 4-step wizard for adding/editing subscriptions with preset and custom provider catalog.
- High-security Credential Vault with AES-256-GCM encryption/decryption on demand and clipboard copying.
- Supabase SQL migration schema with RLS policies, indexing, and auto-update triggers.
- Vercel cron route for automated subscription reminder checks.
- Custom generated high-res sci-fi backgrounds and category icons.
