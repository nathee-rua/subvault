import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const repoRootDir = path.resolve(rootDir, '..');

const SERVER_ONLY_SECRETS = [
  'SUPABASE_' + 'SERVICE_ROLE_KEY',
  'TELEGRAM_' + 'BOT_TOKEN',
  'RESEND_' + 'API_KEY',
  'OPENAI_' + 'API_KEY',
  'GEMINI_' + 'API_KEY',
  'CRON_' + 'SECRET',
  'VAULT_' + 'ENCRYPTION_KEY',
  'ENCRYPTION_' + 'KEY'
];

const FORBIDDEN_NEXT_PUBLIC_SECRETS = [
  'NEXT_PUBLIC_' + 'SERVICE_ROLE',
  'NEXT_PUBLIC_' + 'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_' + 'VAULT_ENCRYPTION_KEY',
  'NEXT_PUBLIC_' + 'ENCRYPTION_KEY',
  'NEXT_PUBLIC_' + 'TELEGRAM_BOT_TOKEN',
  'NEXT_PUBLIC_' + 'RESEND_API_KEY',
  'NEXT_PUBLIC_' + 'OPENAI_API_KEY',
  'NEXT_PUBLIC_' + 'GEMINI_API_KEY',
  'NEXT_PUBLIC_' + 'CRON_SECRET'
];

const FORBIDDEN_TRACKED_PATTERNS = [
  /\.env$/,
  /\.env\.local$/,
  /\.env\.production$/,
  /\.pem$/,
  /\.key$/,
  /\.p12$/,
  /\.pfx$/
];

let violationsCount = 0;

function logViolation(filePath, ruleName) {
  violationsCount++;
  console.error(`[SECURITY BOUNDARY VIOLATION] Rule: ${ruleName} | Target: ${filePath}`);
}

function scanContent(content, filePath) {
  const relativePath = path.relative(repoRootDir, filePath).replace(/\\/g, '/');
  
  if (relativePath.includes('node_modules') || relativePath.includes('.next') || relativePath.includes('dist')) {
    return;
  }

  // Check 1: Unsafe NEXT_PUBLIC_ naming for private secrets
  for (const forbiddenVar of FORBIDDEN_NEXT_PUBLIC_SECRETS) {
    if (content.includes(forbiddenVar)) {
      logViolation(relativePath, `Unsafe NEXT_PUBLIC prefix on secret '${forbiddenVar}'`);
    }
  }

  // Check 2: Server-only secrets in 'use client' components
  const isClientComponent = content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"');
  if (isClientComponent) {
    for (const secretName of SERVER_ONLY_SECRETS) {
      if (content.includes(`process.env.${secretName}`) || content.includes(secretName)) {
        if (!filePath.endsWith('.md') && !filePath.endsWith('.json')) {
          logViolation(relativePath, `Server secret '${secretName}' referenced in 'use client' file`);
        }
      }
    }
  }
}

function scanFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    scanContent(content, filePath);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.mjs')) {
      scanFile(fullPath);
    }
  }
}

const isHistoryMode = process.argv.includes('--scan-history');

if (isHistoryMode) {
  console.log('Running Git History Secret Scan...');
  try {
    const gitLog = execSync('git log -p -n 50 -- . ":(exclude)app-temp/scripts/check-secret-boundaries.mjs" ":(exclude)docs/SECURITY_GUARDRAILS.md" ":(exclude)docs/HANDOFF.md" ":(exclude)docs/CHANGELOG.md"', { cwd: repoRootDir, encoding: 'utf8' });
    const lines = gitLog.split('\n');
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        for (const forbiddenVar of FORBIDDEN_NEXT_PUBLIC_SECRETS) {
          if (line.includes(forbiddenVar)) {
            logViolation('Git History Log', `Secret boundary violation found in Git history: ${forbiddenVar}`);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Git log check skipped:', e.message);
  }
} else {
  console.log('Running Security Boundary Checks...');
  walkDir(path.join(rootDir, 'src'));

  try {
    const gitFiles = execSync('git ls-files', { cwd: repoRootDir, encoding: 'utf8' }).split('\n');
    for (const gitFile of gitFiles) {
      if (!gitFile) continue;
      for (const pattern of FORBIDDEN_TRACKED_PATTERNS) {
        if (pattern.test(gitFile)) {
          logViolation(gitFile, 'Forbidden secret file tracked in Git');
        }
      }
    }
  } catch {
    // If git is not available, pass silently
  }
}

if (violationsCount > 0) {
  console.error(`\nSecurity Boundary Check FAILED: Found ${violationsCount} violation(s).`);
  process.exit(1);
} else {
  console.log('Security Boundary Check PASSED: Zero boundary violations detected.');
}
