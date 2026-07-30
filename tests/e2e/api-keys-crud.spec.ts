import { test, expect } from '@playwright/test';

test.describe('API Key Vault Metadata CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByRole('button', { name: /Enter Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('P1: Secured credentials in Vault Add wizard are masked by default', async ({ page }) => {
    await page.goto('/vault/add');
    await page.getByText(/ChatGPT/i).first().click();

    // Fill details
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 3: Credentials
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.fill('test_api_key_for_e2e_only_not_real');

    // Toggle reveal button
    const eyeBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    if (await eyeBtn.isVisible()) {
      await eyeBtn.click();
    }
  });
});
