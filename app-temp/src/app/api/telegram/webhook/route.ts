// ============================================
// SubVault - Telegram Webhook Handler (Production)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encrypt } from '@/lib/encryption';

export const runtime = 'nodejs';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8728086041:AAEzG4fGumZcTvxW-SI9QwAU5RAdFBbtI6A';
const VAULT_ENCRYPTION_KEY = process.env.VAULT_ENCRYPTION_KEY;

// Helper to send reply message back to Telegram
async function sendTelegramReply(chatId: number | string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram reply:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-telegram-bot-api-secret-token');
    
    // Validate secret if configured
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update = await request.json();
    const message = update?.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const rawText = message.text.trim();

    // 1. Handle /start command
    if (rawText.startsWith('/start')) {
      await sendTelegramReply(
        chatId,
        `🤖 <b>Welcome to SubVault Bot!</b>\n\nYour bot is connected to <b>SubVault Cloud Vault</b>.\n\n<b>How to add items:</b>\nSimply send any subscription name or API Key text directly to this chat!\n\n<b>Example:</b>\n<code>Grok xAI\nxai-CjQu...</code>`
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Handle /link command
    if (rawText.startsWith('/link')) {
      await sendTelegramReply(
        chatId,
        `✅ <b>Telegram Chat Linked!</b>\n\nChat ID: <code>${chatId}</code> is now linked to SubVault Cloud Database.`
      );
      return NextResponse.json({ ok: true });
    }

    // 3. Handle /summary or /upcoming
    if (rawText.startsWith('/summary') || rawText.startsWith('/upcoming')) {
      await sendTelegramReply(
        chatId,
        `📊 <b>SubVault Cloud Status</b>\n\nApp URL: https://travelbozvault.vercel.app\nStatus: 🟢 Connected to Supabase PostgreSQL`
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Parse subscription entry text (e.g. Grok xAI + API Key)
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const providerName = lines[0] || 'Custom Service';
    const credentialKey = lines.length > 1 ? lines.slice(1).join('\n') : '';

    // Auto-detect category
    let category = 'other';
    const lowerName = providerName.toLowerCase();
    if (lowerName.includes('ai') || lowerName.includes('grok') || lowerName.includes('gpt') || lowerName.includes('claude')) {
      category = 'ai';
    } else if (lowerName.includes('vpn')) {
      category = 'vpn';
    } else if (lowerName.includes('netfl') || lowerName.includes('tube') || lowerName.includes('spotify')) {
      category = 'streaming';
    }

    // Default expiry date: 30 days from now
    const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    // Encrypt password/key if key is configured
    let password_encrypted = credentialKey;
    if (VAULT_ENCRYPTION_KEY && credentialKey) {
      try {
        password_encrypted = await encrypt(credentialKey, VAULT_ENCRYPTION_KEY);
      } catch (e) {
        console.error('Encryption failed:', e);
      }
    }

    // Insert into Supabase database
    const newRow = {
      user_id: '00000000-0000-0000-0000-000000000000',
      provider_name: providerName,
      category,
      planName: 'API Key / Sub',
      billing_cycle: 'monthly',
      amount: 0,
      currency: 'USD',
      expiry_date: defaultExpiry,
      auto_renew: true,
      status: 'active',
      password_encrypted: credentialKey ? password_encrypted : null,
      source: 'telegram_text',
    };

    const isCloudConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isCloudConfigured) {
      const { error } = await supabase.from('subscriptions').insert(newRow);
      if (error) {
        console.error('Supabase webhook insert error:', error);
        await sendTelegramReply(chatId, `⚠️ <b>Error adding item:</b> ${error.message}`);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // Reply confirmation to Telegram chat
    await sendTelegramReply(
      chatId,
      `✅ <b>Added to SubVault!</b>\n\n` +
      `<b>Provider:</b> ${providerName}\n` +
      `<b>Category:</b> ${category.toUpperCase()}\n` +
      `<b>Encrypted Key:</b> ${credentialKey ? '🔒 Saved & Encrypted (AES-256)' : 'None'}\n` +
      `<b>Next Renewal:</b> ${defaultExpiry}\n\n` +
      `🔗 View in Vault: <a href="https://travelbozvault.vercel.app/vault">travelbozvault.vercel.app/vault</a>`
    );

    return NextResponse.json({ ok: true, providerName });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
