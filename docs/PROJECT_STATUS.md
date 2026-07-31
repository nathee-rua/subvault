# SubVault - Project Status

## Project Summary
- **Name:** SubVault - Personal Subscription Tracker + Encrypted Credential Vault
- **Purpose:** Sci-fi themed Next.js 15 web app for managing personal subscriptions and encrypted credential storage.
- **Stack:** Next.js 15 (App Router), TypeScript, Glassmorphism Vanilla CSS, Zustand, Recharts, Lucide Icons, Framer Motion, AES-256-GCM, Supabase PostgreSQL, Vercel Cron, Gitleaks 8.30.1, Playwright 1.62.

## Current State & Phase
- **Current Phase:** Phase 9 - Playwright E2E Acceptance Testing & CI Pipeline Fully Verified
- **Branch:** master
- **Clean Build & Test Status:** Gitleaks 8.30.1 verified working tree & history scan (0 leaks found), 8 unit tests passed, 0 boundary violations, clean `tsc --noEmit` typecheck, 22/22 Playwright E2E browser tests passed (desktop + mobile), clean `npx next build` production build (10 routes compiled).

## Automated Guardrail Commands
- `npm run security:boundaries` - Static check for server-only secret references and NEXT_PUBLIC naming (`node app-temp/scripts/check-secret-boundaries.mjs`).
- `npm run secrets:check` - Working tree secret leak scan using Gitleaks (`npx gitleaks dir . --config .gitleaks.toml --redact --exit-code 1 --no-banner`).
- `npm run secrets:history` - Git commit history secret scan using Gitleaks (`npx gitleaks git . --config .gitleaks.toml --redact --exit-code 1 --no-banner`).
- `npm run security:check` - Combined boundary and working tree check.
- `npm run typecheck` - TypeScript static typecheck (`tsc --noEmit`).
- `npm run e2e:guard` - Verifies test environment safety before executing browser tests.
- `npm run e2e:smoke` - Executes core smoke tests (@smoke tag).
- `npm run e2e` - Executes full Playwright E2E browser acceptance test suite.
- `npm run db:test` - Supabase pgTAP database RLS test suite (`supabase test db`).
- `npm run test` - Unit tests for encryption contracts and API payload masking.
- `npm run build` - Full Next.js typecheck and production build.

## Manual Pending Validations
- `npm run db:test`: Requires local Docker and Supabase CLI installed (`supabase test db`). SQL structure verified statically in `supabase/tests/database/rls_verification.test.sql`.

Last Updated: 2026-07-31 11:30 ICT
Last Updated By: Antigravity 2.0
