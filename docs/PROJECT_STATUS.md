# SubVault - Project Status

## Project Summary
- **Name:** SubVault - Personal Subscription Tracker + Encrypted Credential Vault
- **Purpose:** Sci-fi themed Next.js 15 web app for managing personal subscriptions and encrypted credential storage.
- **Stack:** Next.js 15 (App Router), TypeScript, Glassmorphism Vanilla CSS, Zustand, Recharts, Lucide Icons, Framer Motion, AES-256-GCM, Supabase PostgreSQL 17, Vercel Cron, Gitleaks 8.30.1, Playwright 1.62.
- **Production URL:** [https://travelbozvault.vercel.app](https://travelbozvault.vercel.app)
- **GitHub Repository:** [https://github.com/nathee-rua/subvault](https://github.com/nathee-rua/subvault)
- **Supabase Project:** SubVault (`vnueckwzcovkzremoqzz` in `ap-southeast-1`)

## Current State & Phase
- **Current Phase:** Phase 11 - Real Server API & Supabase Database Production Hardening Complete
- **Branch:** master
- **Status:** Supabase PostgreSQL 17 database integrated with server-side `AES-256-GCM` encryption/decryption on REST API endpoints (`/api/subscriptions`), real-time hybrid cloud sync enabled, Telegram Bot (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: 2140484373) configured in production environment, Vercel production deployment active & healthy at [https://travelbozvault.vercel.app](https://travelbozvault.vercel.app).

## Automated Guardrail Commands
- `npm run security:boundaries` - Static check for server-only secret references (`node app-temp/scripts/check-secret-boundaries.mjs`).
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

Last Updated: 2026-07-31 14:02 ICT
Last Updated By: Antigravity 2.0
