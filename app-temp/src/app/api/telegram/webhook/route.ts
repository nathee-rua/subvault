// ============================================
// SubVault - Telegram Webhook API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const update = await request.json();

  // In production, this handles:
  // 1. /start command - Welcome message
  // 2. /link <code> - Link Telegram to SubVault account
  // 3. /add - Start interactive subscription creation
  // 4. /upcoming - Show upcoming renewals
  // 5. /today - Show today's items
  // 6. /summary - Active subscription summary
  // 7. Text messages - AI text extraction via Gemini
  // 8. Photo messages - AI image/receipt extraction via Gemini Vision
  // 9. Callback queries - Inline button actions (snooze, mark paid, etc.)

  return NextResponse.json({ 
    ok: true,
    message: 'Webhook received (demo mode)',
    updateId: update.update_id,
  });
}
