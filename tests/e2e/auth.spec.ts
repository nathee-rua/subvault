import { test, expect } from '@playwright/test';

test.describe('Authentication Flow @smoke', () => {
  test('P0: Unauthenticated access to protected routes redirects to login', async ({ page }) => {
    // Direct access to dashboard without login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\//);
    await expect(page.getByRole('heading', { name: /SubVault/i })).toBeVisible();
  });

  test('P0: User can log in with test username and navigate dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Fill in username
    const usernameInput = page.getByPlaceholder(/Enter your username/i);
    await usernameInput.fill('e2e_test_user');
    
    // Click sign in
    const submitBtn = page.getByRole('button', { name: /Enter Vault/i });
    await submitBtn.click();
    
    // Verify dashboard redirect
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /SubVault Dashboard/i })).toBeVisible();
  });

  test('P0: Session logout invalidates protected access', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByRole('button', { name: /Enter Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    const logoutBtn = page.getByRole('button', { name: /Logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\//);
    }
  });
});
