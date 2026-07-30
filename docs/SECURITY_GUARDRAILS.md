# SubVault Security Guardrails & Secret Leak Prevention

## Overview
SubVault enforces strict separation between **Application Runtime Secrets** and **User-stored Encrypted Vault Data**.

---

## 1. Secret Classification & Boundaries

### A. Application Runtime Secrets (Server-Only)
The following environment variables are strictly server-side application credentials. They must **NEVER** be named with a `NEXT_PUBLIC_` prefix or referenced inside client components (`'use client'`):

- `SUPABASE_SERVICE_ROLE_KEY`
- `VAULT_ENCRYPTION_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `CRON_SECRET`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`

### B. User-Stored Vault Data
Personal user credentials (accounts, passwords, private notes) stored in the subscription vault are:
- Encrypted using **AES-256-GCM** before database persistence.
- Never exposed in list views, CSV exports, or reminder payloads.
- Never copied into application environment variables or used as runtime provider credentials.

---

## 2. Automated Quality Gates & Local Developer Commands

Developers can run automated security checks before committing code:

```bash
# 1. Security boundary check (detects server secret imports in client components & forbidden files)
npm run security:boundaries

# 2. Secret leak scan (Gitleaks pattern check)
npm run secrets:check

# 3. Unit test suite (encryption contracts & API payload masking)
npm run test

# 4. Production build verification
npm run build
```

---

## 3. Incident Response Protocol (Accidental Secret Leak)

If an environment secret or real key is accidentally exposed or committed to the repository:

1. **Immediate Revocation:** Revoke/rotate the leaked key immediately at the provider dashboard (e.g. Supabase, Telegram, OpenAI).
2. **Remove from Working Tree:** Delete the secret from local source files and replace with an approved placeholder (e.g. `sk-test-placeholder`).
3. **Purge Git History:** If committed, use `git filter-repo` or BFG Repo-Cleaner to permanently purge the secret from Git history before pushing.
4. **Environment Redeploy:** Update Vercel environment variables with the newly generated secret and trigger a fresh deployment.

---

## 4. Continuous Integration (GitHub Actions)

The `.github/workflows/security.yml` pipeline automatically runs on `push` and `pull_request` to `main`/`master` branches, enforcing:
- Gitleaks secret pattern scanning (`.gitleaks.toml`).
- Static security boundary check (`scripts/check-secret-boundaries.mjs`).
- Next.js production compilation and TypeScript type checking.
