import { test, expect } from '@playwright/test';

test.describe('Vercel Cron Reminder Simulation', () => {
  test('P1: Cron endpoint requires valid authorization header', async ({ request }) => {
    const response = await request.get('/api/cron/subscription-reminders', {
      headers: {
        authorization: 'Bearer wrong_cron_secret',
      },
    });

    // Should reject unauthorized access safely
    expect([401, 403, 500]).toContain(response.status());
  });
});
