# Architecture Decision Log

## ADR 001: Username-Only Single-User Authentication Strategy
- **Date:** 2026-07-30
- **Context:** Need MVP authentication for single-user personal subscription tracker without complex registration requirements.
- **Decision:** Map input username `username` to `username@subvault.local` internally using Supabase Auth / Local Storage session mock.
- **Consequences:** Super simple user onboarding while keeping complete isolation for local/single user data.

## ADR 002: Dual State Layer (Zustand + Supabase Client)
- **Date:** 2026-07-30
- **Context:** App needs immediate offline/demo interactivity as well as persistent SQL database storage capabilities.
- **Decision:** Use Zustand for client state management with pre-populated demo data, synced with Supabase PostgreSQL client via RLS policies.
- **Consequences:** Instant UI rendering and full CRUD speed for end-users, with seamless cloud persistence.

## ADR 003: Versioned AES-256-GCM Credential Encryption
- **Date:** 2026-07-30
- **Context:** Requirement for secure vault storing account emails, passwords, and private notes.
- **Decision:** Encryption helper `src/lib/encryption.ts` using Node/Web Crypto AES-256-GCM. Payload format: `v1:iv_hex:auth_tag_hex:ciphertext_hex`.
- **Consequences:** High security boundary for credentials, masked in UI by default with explicit user reveal toggles.

## ADR 004: Playwright E2E Testing Framework & Safety Guardrails
- **Date:** 2026-07-31
- **Context:** Need automated browser acceptance testing without risk of executing mutating tests against live production endpoints.
- **Decision:** Adopt Playwright for cross-browser testing with pre-flight script `scripts/assert-e2e-safe-env.mjs` asserting `E2E_TEST_MODE=true` and non-production URLs before test execution.
- **Consequences:** Reliable E2E coverage for subscriptions, credentials, settings, and webhook simulations in CI/CD without production risk.
