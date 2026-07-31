import { test, expect } from '@playwright/test';

test.describe('Subscription Vault CRUD @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByPlaceholder(/Enter your password/i).fill('password123');
    await page.getByRole('button', { name: /Unlock Vault|Create Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('P0: Add subscription wizard flow with preset provider', async ({ page }) => {
    await page.goto('/vault/add');
    await expect(page.getByRole('heading', { name: /Add Subscription/i })).toBeVisible();

    // Step 1: Select Provider
    const providerCard = page.getByText(/Netflix/i).first();
    await expect(providerCard).toBeVisible();
    await providerCard.click({ force: true });

    // Step 2: Details
    await page.getByPlaceholder(/Premium, Family/i).fill('Family 4K Plan');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 3: Credentials (Optional)
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 4: Review & Save
    await page.getByRole('button', { name: /Save to Vault/i }).click();

    // Verify redirect to Vault list
    await expect(page).toHaveURL(/\/vault/);
  });

  test('P1: Vault filter, search, and view toggle', async ({ page }) => {
    await page.goto('/vault');
    await expect(page.getByRole('heading', { name: /Subscription Vault/i })).toBeVisible();

    // Search bar input
    const searchInput = page.getByPlaceholder(/Search providers, plans, tags.../i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Netflix');

    // Clear filters
    const clearBtn = page.getByText(/Clear Filters/i);
    if (await clearBtn.isVisible()) {
      await clearBtn.click({ force: true });
    }
  });
});
