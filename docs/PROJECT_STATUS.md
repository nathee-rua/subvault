# SubVault - Project Status

## Project Summary
- **Name:** SubVault - Personal Subscription Tracker + Encrypted Credential Vault
- **Purpose:** Sci-fi themed Next.js 15 web app for managing personal subscriptions and encrypted credential storage.
- **Stack:** Next.js 15 (App Router), TypeScript, Glassmorphism Vanilla CSS, Zustand, Recharts, Lucide Icons, Framer Motion, AES-256-GCM, Supabase PostgreSQL, Vercel Cron, Gitleaks.

## Current State & Phase
- **Current Phase:** Phase 7 - Gitleaks & Database Guardrail Verification Complete
- **Branch:** master
- **Clean Build & Test Status:** All 8 unit tests passed, 0 security boundary violations, 0 history scan violations, clean `npx next build` production build.

## Automated Guardrail Commands
- `npm run security:boundaries` - Static check for server-only secret references and NEXT_PUBLIC naming.
- `npm run secrets:check` - Working tree secret leak verification.
- `npm run secrets:history` - Git commit history secret scan.
- `npm run security:check` - Combined boundary and secret check.
- `npm run db:test` - Supabase pgTAP database RLS test suite (`supabase test db`).
- `npm run test` - Unit tests for encryption contracts and API payload masking.
- `npm run build` - Full Next.js typecheck and production build.

## Manual Pending Validations
- `npm run db:test`: Requires local Docker and Supabase CLI installed (`supabase test db`). SQL structure verified statically in `supabase/tests/database/rls_verification.test.sql`.

Last Updated: 2026-07-30 21:54 ICT
Last Updated By: Antigravity 2.0
