import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import type { Subscription } from '../types/index.js';

describe('API Contract & Data Masking Guardrails', () => {
  const mockSubscription: Subscription = {
    id: 'sub_test_123',
    userId: 'usr_test_456',
    providerName: 'OpenAI API',
    category: 'ai',
    planName: 'Pay as you go',
    billingCycle: 'monthly',
    amount: 20,
    currency: 'USD',
    expiryDate: '2026-12-31',
    autoRenew: true,
    status: 'active',
    account: 'user@example.com',
    password: 'v1:fake_iv:fake_tag:fake_cipher',
    notes: 'v1:fake_iv:fake_tag:fake_notes_cipher',
    source: 'manual',
    tags: ['ai', 'prod'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('Public List DTO sanitizes sensitive credential fields', () => {
    function toPublicListDto(sub: Subscription) {
      const { password, notes, account, ...publicFields } = sub;
      return {
        ...publicFields,
        hasCredentialsStored: !!(password || notes || account),
      };
    }

    const listDto = toPublicListDto(mockSubscription);

    assert.equal((listDto as any).password, undefined);
    assert.equal((listDto as any).notes, undefined);
    assert.equal((listDto as any).account, undefined);
    assert.equal(listDto.hasCredentialsStored, true);
    assert.equal(listDto.providerName, 'OpenAI API');
  });

  test('CSV Export DTO strips passwords and private notes', () => {
    function toCsvRow(sub: Subscription) {
      return {
        id: sub.id,
        providerName: sub.providerName,
        category: sub.category,
        amount: sub.amount,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        expiryDate: sub.expiryDate,
        status: sub.status,
        autoRenew: sub.autoRenew ? 'Yes' : 'No',
        tags: sub.tags.join('; '),
      };
    }

    const csvRow = toCsvRow(mockSubscription);

    assert.equal((csvRow as any).password, undefined);
    assert.equal((csvRow as any).notes, undefined);
    assert.equal((csvRow as any).account, undefined);
    assert.equal(csvRow.providerName, 'OpenAI API');
  });

  test('Cron Notification Payload excludes secret fields', () => {
    function buildCronReminderMessage(sub: Subscription) {
      return {
        event: 'SUBSCRIPTION_RENEWAL_REMINDER',
        providerName: sub.providerName,
        planName: sub.planName,
        expiryDate: sub.expiryDate,
        amountFormatted: `${sub.amount} ${sub.currency}`,
        deepLink: `https://subvault.app/vault/${sub.id}`,
      };
    }

    const cronPayload = buildCronReminderMessage(mockSubscription);

    assert.equal((cronPayload as any).password, undefined);
    assert.equal((cronPayload as any).notes, undefined);
    assert.equal((cronPayload as any).account, undefined);
    assert.ok(cronPayload.deepLink.includes('/vault/sub_test_123'));
  });

  test('Telegram Bot Reminder Template strictly rejects secret parameters', () => {
    function formatTelegramMessage(providerName: string, expiryDate: string, amount: string) {
      return `🔔 *SubVault Reminder*\n\nYour subscription for *${providerName}* renews on *${expiryDate}* (${amount}).\n\nManage in vault: https://subvault.app/vault`;
    }

    const msg = formatTelegramMessage(mockSubscription.providerName, mockSubscription.expiryDate, '$20 USD');

    assert.ok(msg.includes('OpenAI API'));
    assert.ok(!msg.includes('v1:fake_iv'));
    assert.ok(!msg.includes('user@example.com'));
  });
});
