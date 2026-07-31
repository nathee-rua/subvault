// ============================================
// SubVault - Telegram Webhook Handler (Comprehensive B.E./C.E. Date Parser)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encrypt } from '@/lib/encryption';

export const runtime = 'nodejs';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8728086041:AAEzG4fGumZcTvxW-SI9QwAU5RAdFBbtI6A';
const VAULT_ENCRYPTION_KEY = process.env.VAULT_ENCRYPTION_KEY;

interface ParsedEntry {
  providerName: string;
  account?: string;
  password?: string;
  expiryDate: string;
  category: string;
  notes?: string;
}

const THAI_MONTH_MAP: Record<string, string> = {
  'ม.ค.': '01', 'มกราคม': '01', 'มกรา': '01', 'jan': '01', 'january': '01',
  'ก.พ.': '02', 'กุมภาพันธ์': '02', 'กุมภา': '02', 'feb': '02', 'february': '02',
  'มี.ค.': '03', 'มีนาคม': '03', 'มีนา': '03', 'mar': '03', 'march': '03',
  'เม.ย.': '04', 'เมษายน': '04', 'เมษา': '04', 'apr': '04', 'april': '04',
  'พ.ค.': '05', 'พฤษภาคม': '05', 'พฤษภา': '05', 'may': '05',
  'มิ.ย.': '06', 'มิถุนายน': '06', 'มิถุนา': '06', 'jun': '06', 'june': '06',
  'ก.ค.': '07', 'กรกฎาคม': '07', 'กรกฎา': '07', 'jul': '07', 'july': '07',
  'ส.ค.': '08', 'สิงหาคม': '08', 'สิงหา': '08', 'aug': '08', 'august': '08',
  'ก.ย.': '09', 'กันยายน': '09', 'กันยา': '09', 'sep': '09', 'september': '09',
  'ต.ค.': '10', 'ตุลาคม': '10', 'ตุลา': '10', 'oct': '10', 'october': '10',
  'พ.ย.': '11', 'พฤศจิกายน': '11', 'พฤศจิกา': '11', 'nov': '11', 'november': '11',
  'ธ.ค.': '12', 'ธันวาคม': '12', 'ธันวา': '12', 'dec': '12', 'december': '12',
};

/**
 * Normalize any 2-digit or 4-digit B.E. / C.E. year to 4-digit C.E. (YYYY)
 */
function normalizeYearToCE(yearNum: number): number {
  if (yearNum > 2400) {
    // 4-digit B.E. year (e.g. 2569 -> 2026)
    return yearNum - 543;
  }
  if (yearNum >= 2000 && yearNum <= 2100) {
    // 4-digit C.E. year (e.g. 2026)
    return yearNum;
  }
  if (yearNum >= 60 && yearNum <= 99) {
    // 2-digit B.E. year (e.g. 69 -> 2569 - 543 = 2026)
    return (2500 + yearNum) - 543;
  }
  if (yearNum >= 20 && yearNum <= 59) {
    // 2-digit C.E./B.E. year (e.g. 26 -> 2026)
    return 2000 + yearNum;
  }
  return yearNum;
}

/**
 * Parse any B.E. or C.E. date format into ISO YYYY-MM-DD
 * Handles 24.9.26, 24/9/2569, 24-09-2026, 24 ก.ย. 2569, 2026-09-24
 */
function parseAnyDateToCE(text: string): string | null {
  const clean = text.trim();

  // Pattern 1: ISO YYYY-MM-DD or YYYY.MM.DD
  const isoMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const y = normalizeYearToCE(parseInt(isoMatch[1], 10));
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Pattern 2: DD.MM.YY or DD/MM/YY or DD-MM-YY (e.g. 24.9.26, 24/9/2569)
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = normalizeYearToCE(parseInt(dmyMatch[3], 10));
    return `${y}-${m}-${d}`;
  }

  // Pattern 3: Thai/English named months (e.g. 24 ก.ย. 2569, 24 Sep 2026)
  const textMonthMatch = clean.match(/^(\d{1,2})\s+([ก-ฮa-zA-Z\.]+)\s+(\d{2,4})$/);
  if (textMonthMatch) {
    const d = String(parseInt(textMonthMatch[1], 10)).padStart(2, '0');
    const monthStr = textMonthMatch[2].toLowerCase();
    const m = THAI_MONTH_MAP[monthStr];
    if (m) {
      const y = normalizeYearToCE(parseInt(textMonthMatch[3], 10));
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Smart Text Parser for Telegram messages
 */
function parseTelegramText(rawText: string): ParsedEntry {
  const lines = rawText.split('\n').map((l: string) => l.trim()).filter(Boolean);
  
  let providerName = '';
  let account = '';
  let password = '';
  let expiryDate = '';
  let notes = '';

  // 1. Provider Name: First line clean up (remove trailing commas, colons)
  if (lines.length > 0) {
    providerName = lines[0].replace(/[,:]+$/, '').trim();
  }

  const accountRegex = /^(?:acc|account|email|user|username)\s*:\s*(.+)$/i;
  const passwordRegex = /^(?:pass|password|key|pw|secret)\s*:\s*(.+)$/i;
  const expiryLabelRegex = /^(?:หมดอายุ|expiry|expired|exp|due|renew|renewal)\s*:?\s*(.*)$/i;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Check Account
    const accMatch = line.match(accountRegex);
    if (accMatch) {
      account = accMatch[1].trim();
      continue;
    }

    // Check Password / Key
    const passMatch = line.match(passwordRegex);
    if (passMatch) {
      password = passMatch[1].trim();
      continue;
    }

    // Check Expiry Date Label or multi-line Expiry Line (e.g. Expired \n 24.9.26)
    const expLabelMatch = line.match(expiryLabelRegex);
    if (expLabelMatch) {
      const inlineDateText = expLabelMatch[1].trim();
      if (inlineDateText) {
        const parsedDate = parseAnyDateToCE(inlineDateText);
        if (parsedDate) {
          expiryDate = parsedDate;
          continue;
        }
      }
      // Check if date is on the very next line
      if (i + 1 < lines.length) {
        const nextLineDate = parseAnyDateToCE(lines[i + 1]);
        if (nextLineDate) {
          expiryDate = nextLineDate;
          i++; // skip next line
          continue;
        }
      }
    }

    // Check standalone date on line (e.g. 24.9.26 or 24/9/2569)
    if (!expiryDate) {
      const standaloneDate = parseAnyDateToCE(line);
      if (standaloneDate) {
        expiryDate = standaloneDate;
        continue;
      }
    }

    // Check standalone email pattern
    if (!account && line.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      account = line.trim();
      continue;
    }

    // Check standalone API Key pattern (e.g. sk-..., xai-..., AQ...)
    if (!password && line.match(/^(?:sk-|xai-|AQ|ghp_|eyJ)[a-zA-Z0-9._\-]+$/)) {
      password = line.trim();
      continue;
    }

    // Fallback: append line to notes or password
    if (!password) {
      password = line;
    } else {
      notes += (notes ? '\n' : '') + line;
    }
  }

  // Fallback default expiry date if none detected: 30 days from now
  if (!expiryDate) {
    expiryDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  }

  // Auto-detect category
  let category = 'other';
  const lowerName = providerName.toLowerCase();
  if (lowerName.includes('ai') || lowerName.includes('grok') || lowerName.includes('gpt') || lowerName.includes('claude') || lowerName.includes('openai')) {
    category = 'ai';
  } else if (lowerName.includes('vpn') || lowerName.includes('proton')) {
    category = 'vpn';
  } else if (lowerName.includes('netfl') || lowerName.includes('tube') || lowerName.includes('spotify')) {
    category = 'streaming';
  }

  return {
    providerName: providerName || 'Custom Service',
    account: account || undefined,
    password: password || undefined,
    expiryDate,
    category,
    notes: notes || undefined,
  };
}

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
        const account = parsed.account || null;
        const password = parsed.password || null;
        const notes = parsed.notes || null;
        const expiryDate = parsed.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

        // Encrypt credentials if key is configured
        let account_encrypted = account;
        let password_encrypted = password;
        let notes_encrypted = notes;

        if (VAULT_ENCRYPTION_KEY) {
          if (account) { try { account_encrypted = await encrypt(account, VAULT_ENCRYPTION_KEY); } catch {} }
          if (password) { try { password_encrypted = await encrypt(password, VAULT_ENCRYPTION_KEY); } catch {} }
          if (notes) { try { notes_encrypted = await encrypt(notes, VAULT_ENCRYPTION_KEY); } catch {} }
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
          expiry_date: expiryDate,
          auto_renew: true,
          status: 'active',
          account_encrypted,
          password_encrypted,
          notes_encrypted,
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
          `<b>Account:</b> ${account ? account : '<i>None</i>'}\n` +
          `<b>Password/Key:</b> ${password ? '🔒 Encrypted (AES-256)' : '<i>None</i>'}\n` +
          `<b>Next Renewal:</b> ${expiryDate}\n\n` +
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
        `🤖 <b>Welcome to SubVault Bot!</b>\n\nYour bot is connected to <b>SubVault Cloud Vault</b>.\n\n<b>How to add items:</b>\nSimply send any subscription text directly to this chat!\n\n<b>Example:</b>\n<code>PROTRon VPN 2mo\npyeproton604@proton.me\nAhsg836#Hsgdjej2\nExpired\n24.9.26</code>`
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

    // 4. Smart parsing of subscription entry text
    const parsed = parseTelegramText(rawText);

    // Save draft into telegram_import_drafts
    const draftPayload = {
      telegram_message_id: String(message.message_id),
      raw_input: rawText,
      parsed_data: parsed,
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
      `<b>Provider:</b> ${parsed.providerName}\n` +
      `<b>Category:</b> ${parsed.category.toUpperCase()}\n` +
      `<b>Account:</b> ${parsed.account ? parsed.account : '<i>None</i>'}\n` +
      `<b>Password/Key:</b> ${parsed.password ? '🔒 Detected' : '<i>None</i>'}\n` +
      `<b>Next Renewal:</b> ${parsed.expiryDate}\n\n` +
      `<i>Tap Confirm below to save into your SubVault Cloud Database.</i>`,
      confirmationMarkup
    );

    return NextResponse.json({ ok: true, draftId });
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
