import { test, expect } from '@playwright/test';

test.describe('Authentication Flow @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('P0: Unauthenticated access to protected routes redirects to login', async ({ page }) => {
    // Direct access to dashboard without login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\//);
    await expect(page.getByRole('heading', { name: /SubVault/i })).toBeVisible();
  });

  test('P0: User can log in with test username and navigate dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Fill in username & password
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByPlaceholder(/Enter your password/i).fill('password123');
    
    // Click unlock vault button
    const submitBtn = page.getByRole('button', { name: /Unlock Vault|Create Vault/i });
    await submitBtn.click();
    
    // Verify dashboard redirect
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /System Overview/i })).toBeVisible();
  });

  test('P0: Session logout invalidates protected access', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByPlaceholder(/Enter your password/i).fill('password123');
    await page.getByRole('button', { name: /Unlock Vault|Create Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Open mobile sidebar menu if on mobile viewport
    const menuBtn = page.locator('.mobile-header button').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }

    // Logout
    const logoutBtn = page.getByRole('button', { name: /Sign Out|Logout/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();
    await expect(page).toHaveURL(/\//);
  });
});
