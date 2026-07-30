# Changelog

All notable changes to SubVault will be documented in this file.

## [Unreleased]
### Testing
- Integrated Playwright v1.62 E2E browser acceptance testing suite (`tests/e2e/`).
- Added environment safety guard script (`scripts/assert-e2e-safe-env.mjs`) to prevent running destructive E2E tests against production environments.
- Added GitHub Actions workflow (`.github/workflows/e2e.yml`) for automated Playwright browser testing on pull requests and main/master pushes.
- Added HTML report generation script (`scripts/generate-e2e-report.mjs`) and E2E guide (`docs/E2E_TESTING.md`).

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
