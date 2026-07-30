import { test, expect } from '@playwright/test';
import { parseMockReceiptText } from './helpers/mock-ai-extractor.js';

test.describe('AI Receipt Extraction Simulation', () => {
  test('P1: AI Mock Receipt Parser returns deterministic parsed fields', async () => {
    const rawText = 'Netflix Premium Invoice 499 THB';
    const parsed = parseMockReceiptText(rawText);

    expect(parsed.providerName).toBe('Netflix');
    expect(parsed.amount).toBe(499);
    expect(parsed.currency).toBe('THB');
    expect(parsed.billingCycle).toBe('monthly');
  });
});
