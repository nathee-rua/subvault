import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SERVER_ONLY_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'CRON_SECRET',
  'VAULT_ENCRYPTION_KEY',
  'ENCRYPTION_KEY'
];

const FORBIDDEN_NEXT_PUBLIC_SECRETS = [
  'NEXT_PUBLIC_SERVICE_ROLE',
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_VAULT_ENCRYPTION_KEY',
  'NEXT_PUBLIC_ENCRYPTION_KEY',
  'NEXT_PUBLIC_TELEGRAM_BOT_TOKEN',
  'NEXT_PUBLIC_RESEND_API_KEY',
  'NEXT_PUBLIC_OPENAI_API_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY',
  'NEXT_PUBLIC_CRON_SECRET'
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
  console.error(`[SECURITY BOUNDARY VIOLATION] Rule: ${ruleName} | File: ${filePath}`);
}

function scanFile(filePath) {
  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  
  // Skip node_modules and build dirs
  if (relativePath.includes('node_modules') || relativePath.includes('.next') || relativePath.includes('dist')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

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
        // Exception: comments or markdown docs
        if (!filePath.endsWith('.md') && !filePath.endsWith('.json')) {
          logViolation(relativePath, `Server secret '${secretName}' referenced in 'use client' file`);
        }
      }
    }
  }
}

function walkDir(dir) {
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

console.log('Running Security Boundary Checks...');

// 1. Scan source code
walkDir(path.join(rootDir, 'src'));

// 2. Check tracked git files for forbidden secret filenames
try {
  const gitFiles = execSync('git ls-files', { cwd: rootDir, encoding: 'utf8' }).split('\n');
  for (const gitFile of gitFiles) {
    if (!gitFile) continue;
    for (const pattern of FORBIDDEN_TRACKED_PATTERNS) {
      if (pattern.test(gitFile)) {
        logViolation(gitFile, 'Forbidden secret file tracked in Git');
      }
    }
  }
} catch {
  // If git is not available in environment, pass silently
}

if (violationsCount > 0) {
  console.error(`\nSecurity Boundary Check FAILED: Found ${violationsCount} violation(s).`);
  process.exit(1);
} else {
  console.log('Security Boundary Check PASSED: Zero boundary violations detected.');
}
