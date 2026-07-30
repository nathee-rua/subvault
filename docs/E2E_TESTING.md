# SubVault End-to-End (E2E) Acceptance Testing Guide

## Overview
SubVault features a complete, repeatable browser-based acceptance testing suite built with **Playwright**.

---

## 1. Safety Guard & Execution Rules

E2E tests execute only against local dev servers (`http://localhost:3000`) or dedicated staging URLs (`E2E_BASE_URL`).

Before every test run, `scripts/assert-e2e-safe-env.mjs` verifies:
- `E2E_TEST_MODE=true`
- `E2E_BASE_URL` does not match production domains.
- `VERCEL_ENV` is not `production`.
- `E2E_ALLOW_DESTRUCTIVE_TESTS=true`.

---

## 2. Developer Commands

```bash
# 1. Environment Safety Check
npm run e2e:guard

# 2. Run Headless E2E Test Suite
npm run e2e

# 3. Run Core Smoke Tests Only (@smoke)
npm run e2e:smoke

# 4. Open Interactive Playwright UI Mode
npm run e2e:ui

# 5. Run Headed Browsers
npm run e2e:headed

# 6. View HTML Report
npm run e2e:report

# 7. Install Playwright Chromium Binary
npm run e2e:install
```

---

## 3. Mock Adapters & Fixtures
- **Telegram Bot Simulator:** Mock webhooks (`/api/telegram/webhook`) and `/upcoming` command verification using test chat IDs.
- **AI Receipt Extractor:** Mock parsing fixtures (`receipt-text.txt`, `receipt-image.png`) returning deterministic test drafts.
- **Vercel Cron Reminder Simulator:** Authorization check and reminder deduplication tests.

---

## 4. Continuous Integration (GitHub Actions)

The `.github/workflows/e2e.yml` pipeline automatically runs headless Chromium E2E tests on `pull_request` and `workflow_dispatch` with 7-day failure artifact retention.
