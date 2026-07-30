import { URL } from 'url';

console.log('Running E2E Safe Environment Guard...');

const E2E_TEST_MODE = process.env.E2E_TEST_MODE || 'true'; // Default true for local dev
const E2E_BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const E2E_TEST_ENVIRONMENT = process.env.E2E_TEST_ENVIRONMENT || 'local';
const E2E_ALLOW_DESTRUCTIVE_TESTS = process.env.E2E_ALLOW_DESTRUCTIVE_TESTS || 'true';
const VERCEL_ENV = process.env.VERCEL_ENV || 'development';

let violations = [];

// Rule 1: E2E_TEST_MODE must be true
if (E2E_TEST_MODE !== 'true') {
  violations.push('E2E_TEST_MODE must be set to "true"');
}

// Rule 2: Reject production Vercel environment
if (VERCEL_ENV === 'production') {
  violations.push('Refusing to run E2E tests: VERCEL_ENV is set to "production"');
}

// Rule 3: Reject production URL patterns in Base URL
try {
  const parsedUrl = new URL(E2E_BASE_URL);
  const hostname = parsedUrl.hostname.toLowerCase();
  
  if (hostname.includes('prod') || hostname.includes('subvault.app') || (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('vercel.app') && !hostname.includes('local'))) {
    violations.push(`Refusing to run E2E tests: Base URL hostname '${hostname}' resembles production`);
  }
} catch (e) {
  violations.push(`Invalid E2E_BASE_URL format: ${e.message}`);
}

// Rule 4: Test Environment must be local or staging
if (E2E_TEST_ENVIRONMENT !== 'local' && E2E_TEST_ENVIRONMENT !== 'staging') {
  violations.push(`E2E_TEST_ENVIRONMENT must be "local" or "staging", got "${E2E_TEST_ENVIRONMENT}"`);
}

// Rule 5: Destructive test flag check
if (E2E_ALLOW_DESTRUCTIVE_TESTS !== 'true') {
  violations.push('E2E_ALLOW_DESTRUCTIVE_TESTS must be "true" for test execution');
}

if (violations.length > 0) {
  console.error('\n🔴 E2E ENVIRONMENT GUARD FAILED: Unsafe execution environment detected!');
  for (const v of violations) {
    console.error(` - ${v}`);
  }
  process.exit(1);
} else {
  console.log('🟢 E2E ENVIRONMENT GUARD PASSED: Safe local/staging test environment confirmed.');
  console.log(` - Target Base URL: ${E2E_BASE_URL}`);
  console.log(` - Environment Mode: ${E2E_TEST_ENVIRONMENT}`);
}
