// ============================================
// SubVault - Telegram Bot Test & Link API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { botToken, chatId } = await request.json();

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Bot Token and Chat ID are required' }, { status: 400 });
    }

    // 1. Verify Bot Token via Telegram getMe API
    const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json({ error: getMeData.description || 'Invalid Telegram Bot Token' }, { status: 400 });
    }

    const botInfo = getMeData.result;

    // 2. Send Telegram Confirmation Message to Chat ID
    const msgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✅ <b>Connection successful!</b>\n\nSubVault is now successfully linked to your Telegram account (Chat ID: <code>${chatId}</code>).`,
        parse_mode: 'HTML',
      }),
    });

    const msgData = await msgRes.json();
    if (!msgData.ok) {
      return NextResponse.json({ error: msgData.description || 'Failed to send Telegram message to Chat ID' }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      botName: botInfo.first_name,
      botUsername: botInfo.username,
      message: 'Connection successful',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
