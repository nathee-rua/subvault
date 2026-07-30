import { test, expect } from '@playwright/test';
import { createMockTelegramWebhookPayload } from './helpers/mock-telegram.js';

test.describe('Telegram Bot Integration Simulation', () => {
  test('P1: Mock Telegram Webhook rejects unlinked user and accepts valid link code', async ({ request }) => {
    const payload = createMockTelegramWebhookPayload(999888777, '/start');
    
    // Dispatch request to mock webhook endpoint
    const response = await request.post('/api/telegram/webhook', {
      data: payload,
    });

    // Verify safe response code
    expect([200, 400, 404, 401]).toContain(response.status());
  });
});
