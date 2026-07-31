import { test, expect } from '@playwright/test';

test.describe('Settings and Preferences Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByPlaceholder(/Enter your password/i).fill('password123');
    await page.getByRole('button', { name: /Unlock Vault|Create Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('P2: User can open settings and configure preferences', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();

    // Verify settings navigation tabs/sections exist
    await expect(page.getByText(/Profile/i).first()).toBeVisible();
    
    // Switch to Notifications tab
    await page.getByRole('button', { name: /Notifications/i }).click();
    await expect(page.getByRole('main').getByText(/Telegram Bot/i).first()).toBeVisible();
  });
});
