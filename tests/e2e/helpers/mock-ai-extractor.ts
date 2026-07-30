export interface ParsedReceiptDraft {
  providerName: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: string;
  expiryDate: string;
  confidence: number;
}

export function parseMockReceiptText(rawText: string): ParsedReceiptDraft {
  return {
    providerName: 'Netflix',
    planName: 'Premium 4K',
    amount: 499,
    currency: 'THB',
    billingCycle: 'monthly',
    expiryDate: '2026-08-30',
    confidence: 0.95,
  };
}
