// ============================================
// SubVault - Cron Subscription Reminders
// Based on PRD specification
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REMINDER_DAYS = [30, 14, 7, 3, 1, 0];

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const authorization = request.headers.get('authorization');
  
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // In production, this endpoint:
  // 1. Queries Supabase for active subscriptions within 30-day window
  // 2. Calculates days until expiry for each
  // 3. Checks reminder_preferences for enabled reminder windows
  // 4. Checks notification_logs for deduplication
  // 5. Sends Telegram messages via Bot API
  // 6. Logs sent notifications

  return NextResponse.json({
    success: true,
    message: 'Cron endpoint ready - Connect Supabase and Telegram to enable',
    reminderDays: REMINDER_DAYS,
    status: 'demo_mode',
  });
}
