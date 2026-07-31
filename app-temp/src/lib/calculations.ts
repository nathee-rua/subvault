// ============================================
// SubVault - Calculation Utilities (Lifetime/Never Expiry Supported)
// ============================================

import { 
  Subscription, 
  BillingCycle, 
  Category, 
  CategoryBreakdown, 
  CurrencyBreakdown, 
  DashboardStats, 
  UpcomingRenewal,
  CATEGORY_CONFIG,
  Currency
} from '@/types';

/**
 * Convert any billing cycle amount to monthly equivalent
 */
export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case '6-month': return amount / 6;
    case 'annual': return amount / 12;
    case 'custom': return amount; // assume monthly for custom
  }
}

/**
 * Convert any billing cycle amount to annual equivalent
 */
export function toAnnualAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'monthly': return amount * 12;
    case 'quarterly': return amount * 4;
    case '6-month': return amount * 2;
    case 'annual': return amount;
    case 'custom': return amount * 12;
  }
}

/**
 * Calculate days until a date from today (handles Lifetime / Never expiry)
 */
export function daysUntil(dateStr?: string | null): number {
  if (!dateStr || dateStr === 'Never' || dateStr === 'Lifetime' || dateStr.startsWith('9999')) {
    return 999999;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 999999;
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    THB: '฿',
    USD: '$',
    EUR: '€',
    JPY: '¥',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Get dashboard statistics
 */
export function getDashboardStats(subscriptions: Subscription[]): DashboardStats {
  const active = subscriptions.filter(s => s.status === 'active' && !s.deletedAt);
  
  const monthlyCost = active.reduce((sum, s) => {
    return sum + toMonthlyAmount(s.amount, s.billingCycle);
  }, 0);

  const annualForecast = active.reduce((sum, s) => {
    return sum + toAnnualAmount(s.amount, s.billingCycle);
  }, 0);

  const upcoming = active.filter(s => {
    const days = daysUntil(s.expiryDate);
    return days >= 0 && days <= 30 && days < 9999;
  });

  const expired = subscriptions.filter(s => {
    const days = daysUntil(s.expiryDate);
    return s.status === 'active' && days < 0;
  });

  return {
    totalActive: active.length,
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    annualForecast: Math.round(annualForecast * 100) / 100,
    upcomingCount: upcoming.length,
    expiredCount: expired.length,
  };
}

/**
 * Get category breakdown for active subscriptions
 */
export function getCategoryBreakdown(subscriptions: Subscription[]): CategoryBreakdown[] {
  const active = subscriptions.filter(s => s.status === 'active' && !s.deletedAt);
  const total = active.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0);

  const categories: Category[] = ['ai', 'vpn', 'streaming', 'cloud', 'gaming', 'other'];
  
  return categories.map(cat => {
    const items = active.filter(s => s.category === cat);
    const amount = items.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0);
    return {
      category: cat,
      label: CATEGORY_CONFIG[cat].label,
      amount: Math.round(amount * 100) / 100,
      count: items.length,
      color: CATEGORY_CONFIG[cat].color,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    };
  }).filter(c => c.count > 0);
}

/**
 * Get currency breakdown
 */
export function getCurrencyBreakdown(subscriptions: Subscription[]): CurrencyBreakdown[] {
  const active = subscriptions.filter(s => s.status === 'active' && !s.deletedAt);
  const currencies = new Map<Currency, { total: number; count: number }>();

  active.forEach(s => {
    const existing = currencies.get(s.currency) || { total: 0, count: 0 };
    existing.total += toMonthlyAmount(s.amount, s.billingCycle);
    existing.count += 1;
    currencies.set(s.currency, existing);
  });

  return Array.from(currencies.entries()).map(([currency, data]) => ({
    currency,
    totalMonthly: Math.round(data.total * 100) / 100,
    count: data.count,
  }));
}

/**
 * Get upcoming renewals sorted by closest first (excludes Lifetime)
 */
export function getUpcomingRenewals(subscriptions: Subscription[], withinDays: number = 30): UpcomingRenewal[] {
  return subscriptions
    .filter(s => s.status === 'active' && !s.deletedAt)
    .map(s => ({
      subscription: s,
      daysLeft: daysUntil(s.expiryDate),
    }))
    .filter(r => r.daysLeft >= 0 && r.daysLeft <= withinDays && r.daysLeft < 9999)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Get expired subscriptions that are still active
 */
export function getExpiredSubscriptions(subscriptions: Subscription[]): Subscription[] {
  return subscriptions
    .filter(s => s.status === 'active' && !s.deletedAt && daysUntil(s.expiryDate) < 0)
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate));
}

/**
 * Get auto-renew risk list (auto-renew ON and expiring within 14 days)
 */
export function getAutoRenewRisks(subscriptions: Subscription[]): UpcomingRenewal[] {
  return subscriptions
    .filter(s => s.status === 'active' && !s.deletedAt && s.autoRenew)
    .map(s => ({
      subscription: s,
      daysLeft: daysUntil(s.expiryDate),
    }))
    .filter(r => r.daysLeft >= 0 && r.daysLeft <= 14 && r.daysLeft < 9999)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * Calculate next renewal date based on billing cycle
 */
export function calculateNextRenewalDate(currentDate: string, cycle: BillingCycle): string {
  if (currentDate.startsWith('9999') || currentDate === 'Never') return '9999-12-31';
  const date = new Date(currentDate);
  if (isNaN(date.getTime())) return '9999-12-31';
  switch (cycle) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case '6-month':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'custom':
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Generate monthly spending data for charts (last 6 months)
 */
export function getMonthlySpendingData(subscriptions: Subscription[]): { month: string; amount: number }[] {
  const months: { month: string; amount: number }[] = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    // Calculate active subscriptions for that month
    const active = subscriptions.filter(s => {
      if (s.deletedAt) return false;
      const start = s.startDate ? new Date(s.startDate) : new Date(s.createdAt);
      const expiry = new Date(s.expiryDate);
      return start <= d && (expiry >= d || s.autoRenew || s.expiryDate?.startsWith('9999'));
    });

    const monthlyTotal = active.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0);
    months.push({ month: monthLabel, amount: Math.round(monthlyTotal) });
  }

  return months;
}

/**
 * Format date string to human readable
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === 'Never' || dateStr === 'Lifetime' || dateStr.startsWith('9999')) {
    return 'Never (Lifetime)';
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Never (Lifetime)';
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get urgency label for days left
 */
export function getUrgencyLabel(daysLeft: number): { text: string; color: string; icon: string } {
  if (daysLeft >= 9999) return { text: '♾️ Lifetime', color: '#00ff88', icon: '♾️' };
  if (daysLeft < 0) return { text: 'Expired', color: '#ef4444', icon: '🔴' };
  if (daysLeft === 0) return { text: 'Today', color: '#ef4444', icon: '🔴' };
  if (daysLeft <= 3) return { text: `${daysLeft}d left`, color: '#f59e0b', icon: '⚠️' };
  if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: '#f59e0b', icon: '🟡' };
  if (daysLeft <= 14) return { text: `${daysLeft}d left`, color: '#3b82f6', icon: '🔵' };
  return { text: `${daysLeft}d left`, color: '#00ff88', icon: '🟢' };
}
