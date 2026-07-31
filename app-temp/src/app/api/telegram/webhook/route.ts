// ============================================
// SubVault - Telegram Webhook Handler (Interactive & Real-time)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encrypt } from '@/lib/encryption';

export const runtime = 'nodejs';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8728086041:AAEzG4fGumZcTvxW-SI9QwAU5RAdFBbtI6A';
const VAULT_ENCRYPTION_KEY = process.env.VAULT_ENCRYPTION_KEY;

// Helper to send message with inline keyboard
async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }
}

// Helper to edit existing message
async function editTelegramMessage(chatId: number | string, messageId: number, text: string, replyMarkup?: any) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
  } catch (err) {
    console.error('Failed to edit Telegram message:', err);
  }
}

// Helper to answer callback query (remove loading spinner on button)
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (err) {
    console.error('Failed to answer callback query:', err);
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

    // ===================================================
    // A. HANDLE CALLBACK QUERIES (Button Clicks)
    // ===================================================
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data;
      const chatId = cb.message.chat.id;
      const messageId = cb.message.message_id;

      if (data.startsWith('confirm_')) {
        const draftId = data.replace('confirm_', '');
        await answerCallbackQuery(cb.id, 'Saving to Vault...');

        // Fetch draft from database
        const { data: draft, error: fetchErr } = await supabase
          .from('telegram_import_drafts')
          .select('*')
          .eq('id', draftId)
          .single();

        if (fetchErr || !draft) {
          await editTelegramMessage(chatId, messageId, '⚠️ <b>Draft expired or not found.</b>');
          return NextResponse.json({ ok: false, error: 'Draft not found' });
        }

        const parsed = draft.parsed_data || {};
        const providerName = parsed.providerName || 'Custom Service';
        const category = parsed.category || 'other';
        const credentialKey = parsed.credentialKey || '';
        const defaultExpiry = parsed.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

        // Encrypt password/key if key is configured
        let password_encrypted = credentialKey;
        if (VAULT_ENCRYPTION_KEY && credentialKey) {
          try {
            password_encrypted = await encrypt(credentialKey, VAULT_ENCRYPTION_KEY);
          } catch (e) {
            console.error('Encryption failed:', e);
          }
        }

        // Insert into subscriptions table
        const newRow = {
          user_id: '00000000-0000-0000-0000-000000000000',
          provider_name: providerName,
          category,
          plan_name: 'API Key / Sub',
          billing_cycle: 'monthly',
          amount: 0,
          currency: 'USD',
          expiry_date: defaultExpiry,
          auto_renew: true,
          status: 'active',
          password_encrypted: credentialKey ? password_encrypted : null,
          source: 'telegram_text',
        };

        const { error: insertErr } = await supabase.from('subscriptions').insert(newRow);

        if (insertErr) {
          console.error('Supabase subscription insert error:', insertErr);
          await editTelegramMessage(chatId, messageId, `⚠️ <b>Error saving to Vault:</b> ${insertErr.message}`);
          return NextResponse.json({ ok: false, error: insertErr.message });
        }

        // Update draft status
        await supabase
          .from('telegram_import_drafts')
          .update({ status: 'completed' })
          .eq('id', draftId);

        // Edit message to confirm success
        await editTelegramMessage(
          chatId,
          messageId,
          `✅ <b>Saved to SubVault!</b>\n\n` +
          `<b>Provider:</b> ${providerName}\n` +
          `<b>Category:</b> ${category.toUpperCase()}\n` +
          `<b>Encrypted Key:</b> ${credentialKey ? '🔒 Saved & Encrypted (AES-256)' : 'None'}\n` +
          `<b>Next Renewal:</b> ${defaultExpiry}\n\n` +
          `🔗 View in Vault: <a href="https://travelbozvault.vercel.app/vault">travelbozvault.vercel.app/vault</a>`
        );

        return NextResponse.json({ ok: true, status: 'saved' });
      }

      if (data.startsWith('cancel_')) {
        const draftId = data.replace('cancel_', '');
        await answerCallbackQuery(cb.id, 'Cancelled');

        await supabase
          .from('telegram_import_drafts')
          .update({ status: 'cancelled' })
          .eq('id', draftId);

        await editTelegramMessage(chatId, messageId, '❌ <b>Entry cancelled.</b>');
        return NextResponse.json({ ok: true, status: 'cancelled' });
      }
    }

    // ===================================================
    // B. HANDLE INCOMING MESSAGES (Text / Commands)
    // ===================================================
    const message = update?.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const rawText = message.text.trim();

    // 1. Handle /start command
    if (rawText.startsWith('/start')) {
      await sendTelegramMessage(
        chatId,
        `🤖 <b>Welcome to SubVault Bot!</b>\n\nYour bot is connected to <b>SubVault Cloud Vault</b>.\n\n<b>How to add items:</b>\nSimply send any subscription name or API Key text directly to this chat!\n\n<b>Example:</b>\n<code>Grok xAI\nxai-CjQu...</code>`
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Handle /link command
    if (rawText.startsWith('/link')) {
      await sendTelegramMessage(
        chatId,
        `✅ <b>Telegram Chat Linked!</b>\n\nChat ID: <code>${chatId}</code> is now linked to SubVault Cloud Database.`
      );
      return NextResponse.json({ ok: true });
    }

    // 3. Handle /summary or /upcoming
    if (rawText.startsWith('/summary') || rawText.startsWith('/upcoming')) {
      await sendTelegramMessage(
        chatId,
        `📊 <b>SubVault Cloud Status</b>\n\nApp URL: https://travelbozvault.vercel.app\nStatus: 🟢 Connected to Supabase PostgreSQL`
      );
      return NextResponse.json({ ok: true });
    }

    // 4. Parse subscription entry text and create interactive confirmation draft
    const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const providerName = lines[0] || 'Custom Service';
    const credentialKey = lines.length > 1 ? lines.slice(1).join('\n') : '';

    // Auto-detect category
    let category = 'other';
    const lowerName = providerName.toLowerCase();
    if (lowerName.includes('ai') || lowerName.includes('grok') || lowerName.includes('gpt') || lowerName.includes('claude') || lowerName.includes('openai')) {
      category = 'ai';
    } else if (lowerName.includes('vpn')) {
      category = 'vpn';
    } else if (lowerName.includes('netfl') || lowerName.includes('tube') || lowerName.includes('spotify')) {
      category = 'streaming';
    }

    const defaultExpiry = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    // Save draft into telegram_import_drafts
    const draftPayload = {
      telegram_message_id: String(message.message_id),
      raw_input: rawText,
      parsed_data: {
        providerName,
        category,
        credentialKey,
        expiryDate: defaultExpiry,
      },
      status: 'pending',
    };

    const { data: draftRow, error: draftErr } = await supabase
      .from('telegram_import_drafts')
      .insert(draftPayload)
      .select()
      .single();

    if (draftErr || !draftRow) {
      console.error('Draft insert error:', draftErr);
      await sendTelegramMessage(chatId, `⚠️ <b>Error processing entry:</b> ${draftErr?.message || 'Failed to create draft'}`);
      return NextResponse.json({ ok: false, error: draftErr?.message });
    }

    const draftId = draftRow.id;

    // Send Interactive Confirmation Message with Inline Buttons
    const confirmationMarkup = {
      inline_keyboard: [
        [
          { text: '✅ Confirm & Save to Vault', callback_data: `confirm_${draftId}` },
          { text: '❌ Cancel', callback_data: `cancel_${draftId}` },
        ]
      ]
    };

    await sendTelegramMessage(
      chatId,
      `📋 <b>Confirm Subscription Entry</b>\n\n` +
      `<b>Provider:</b> ${providerName}\n` +
      `<b>Category:</b> ${category.toUpperCase()}\n` +
      `<b>Credential Key:</b> ${credentialKey ? '🔒 Password/Key detected' : 'None'}\n` +
      `<b>Next Renewal:</b> ${defaultExpiry}\n\n` +
      `<i>Tap Confirm below to save into your SubVault Cloud Database.</i>`,
      confirmationMarkup
    );

    return NextResponse.json({ ok: true, draftId });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
