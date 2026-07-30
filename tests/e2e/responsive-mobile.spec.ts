import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Layout Responsiveness', () => {
  test.use({ viewport: { width: 393, height: 851 } }); // Pixel 7 viewport

  test('P2: Mobile navigation and dashboard render without horizontal overflow', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Enter your username/i).fill('e2e_test_user');
    await page.getByRole('button', { name: /Enter Vault/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify viewport bounds
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
