// ============================================
// SubVault - Core TypeScript Types
// ============================================

export type Category = 'ai' | 'vpn' | 'streaming' | 'cloud' | 'gaming' | 'other';

export type BillingCycle = 'monthly' | 'quarterly' | '6-month' | 'annual' | 'custom';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused' | 'archived';

export type SubscriptionSource = 'manual' | 'telegram_text' | 'telegram_image' | 'import';

export type Currency = 'THB' | 'USD' | 'EUR' | 'JPY' | 'GBP';

export interface Provider {
  id: string;
  name: string;
  category: Category;
  website?: string;
  logoUrl?: string;
  color: string;
  isPreset: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  providerId?: string;
  providerName: string;
  customProviderName?: string;
  category: Category;
  planName?: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: Currency;
  startDate?: string;
  expiryDate: string;
  autoRenew: boolean;
  status: SubscriptionStatus;
  // Encrypted fields (stored as encrypted strings, shown decrypted in UI)
  account?: string;
  password?: string;
  notes?: string;
  supportContact?: string;
  receiptStoragePath?: string;
  source: SubscriptionSource;
  tags: string[];
  lastReminderSnoozedUntil?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SubscriptionFormData {
  providerId?: string;
  providerName: string;
  customProviderName?: string;
  category: Category;
  planName?: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: Currency;
  startDate?: string;
  expiryDate: string;
  autoRenew: boolean;
  account?: string;
  password?: string;
  notes?: string;
  supportContact?: string;
  tags: string[];
  source: SubscriptionSource;
}

export interface DashboardStats {
  totalActive: number;
  monthlyCost: number;
  annualForecast: number;
  upcomingCount: number;
  expiredCount: number;
}

export interface CategoryBreakdown {
  category: Category;
  label: string;
  amount: number;
  count: number;
  color: string;
  percentage: number;
}

export interface CurrencyBreakdown {
  currency: Currency;
  totalMonthly: number;
  count: number;
}

export interface UpcomingRenewal {
  subscription: Subscription;
  daysLeft: number;
}

export interface ReminderPreferences {
  telegramEnabled: boolean;
  reminderDays: number[];
  dailyDigestEnabled: boolean;
  dailyDigestHourUtc: number;
}

export interface UserProfile {
  id: string;
  username: string;
  createdAt: string;
}

// Category display config
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  ai: { label: 'AI', color: '#00f0ff', icon: '🧠' },
  vpn: { label: 'VPN', color: '#00ff88', icon: '🛡️' },
  streaming: { label: 'Streaming', color: '#ff6b6b', icon: '🎬' },
  cloud: { label: 'Cloud/SaaS', color: '#3b82f6', icon: '☁️' },
  gaming: { label: 'Gaming', color: '#8b5cf6', icon: '🎮' },
  other: { label: 'Other', color: '#94a3b8', icon: '⚙️' },
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  '6-month': '6-Month',
  annual: 'Annual',
  custom: 'Custom',
};

export const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#00ff88' },
  cancelled: { label: 'Cancelled', color: '#ff6b6b' },
  expired: { label: 'Expired', color: '#f59e0b' },
  paused: { label: 'Paused', color: '#94a3b8' },
  archived: { label: 'Archived', color: '#64748b' },
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  GBP: '£',
};
