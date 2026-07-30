import { test, expect } from '@playwright/test';

test.describe('Settings and Preferences Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByRole('button', { name: /Enter Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('P2: User can open settings and configure preferences', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();

    // Verify settings navigation tabs/sections exist
    await expect(page.getByText(/Preferences/i)).toBeVisible();
    await expect(page.getByText(/Telegram Integration/i)).toBeVisible();
  });
});
