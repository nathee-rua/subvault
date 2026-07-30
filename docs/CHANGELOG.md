# Changelog

All notable changes to SubVault will be documented in this file.

## [Unreleased]
### Security
- Added automated secret-leak prevention guardrails (`scripts/check-secret-boundaries.mjs`).
- Implemented Gitleaks configuration (`.gitleaks.toml`) and GitHub Actions security workflow (`.github/workflows/security.yml`).
- Added black-box unit test suites for AES-256-GCM encryption and API response DTO payload masking (`src/lib/encryption.test.ts`, `src/lib/api-contracts.test.ts`).
- Added SQL RLS isolation test suite (`supabase/tests/rls_verification_test.sql`).
- Updated `.gitignore` with strict rules for private key files, backups, and secret filenames.
- Created `docs/SECURITY_GUARDRAILS.md` documenting secret classification, local CLI commands, and incident response.

## [1.0.0] - 2026-07-30
### Added
- Complete modern AI Sci-Fi UI design system with particle backgrounds, glowing glassmorphism cards, and cyan/violet accents.
- User authentication flow using single-user MVP username system.
- Interactive Dashboard with spending analytics, renewal timelines, and risk alerts built with Recharts.
- Subscription Vault List supporting search, category filter, status filter, sorting, grid/list view toggle, and soft-delete/restore.
- 4-step wizard for adding/editing subscriptions with preset and custom provider catalog.
- High-security Credential Vault with AES-256-GCM encryption/decryption on demand and clipboard copying.
- Supabase SQL migration schema with RLS policies, indexing, and auto-update triggers.
- Vercel cron route for automated subscription reminder checks.
- Custom generated high-res sci-fi backgrounds and category icons.
