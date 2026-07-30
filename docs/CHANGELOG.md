# Changelog

All notable changes to SubVault will be documented in this file.

## [Unreleased]
### Security
- Added distinct npm security commands (`security:boundaries`, `secrets:check`, `secrets:history`, `security:check`, `db:test`).
- Configured pgTAP RLS verification test file at `supabase/tests/database/rls_verification.test.sql`.
- Updated GitHub Actions workflow (`.github/workflows/security.yml`) with `workflow_dispatch`, `permissions: contents: read`, `fetch-depth: 0`, and non-deploy security steps.
- Configured history scanning and pathspec exclusions for automated secret boundary scripts.

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
