import { test as base, expect } from '@playwright/test';

export interface TestUser {
  username: string;
}

export const test = base.extend<{ testUser: TestUser }>({
  testUser: async ({ page }, use) => {
    const username = `e2e_user_${Date.now()}`;
    await use({ username });
  },
});

export { expect };
